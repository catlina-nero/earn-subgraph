import { BigInt, store } from "@graphprotocol/graph-ts";
import {
  Staked,
  Unstaked,
  Deposit,
  UserAddInterest,
  UserWithdraw,
  StakedBack
} from "../generated/Pledge/Pledge"; // Adjust the import path based on your generated ABIs
import {
  UserPledge,
  FrozenBalance,
  PledgeTypeStaked,
  UserPledgeType,
  PledgeItem
} from "../generated/schema";

export function handleDeposit(event: Deposit): void {
  let user = UserPledge.load(event.params.user.toHex());
  if (user == null) {
    user = new UserPledge(event.params.user.toHex());
    user.address = event.params.user.toHex();
    user.availableBalance = BigInt.fromI32(0);
    user.interest = BigInt.fromI32(0);
    user.totalPledged = BigInt.fromI32(0);
  }
  user.availableBalance = user.availableBalance.plus(event.transaction.value);
  user.save();
}

export function handleStakedBack(event: StakedBack): void {
  let user = UserPledge.load(event.params.user.toHex());
  if (user == null) {
    user = new UserPledge(event.params.user.toHex());
    user.address = event.params.user.toHex();
    user.availableBalance = BigInt.fromI32(0);
    user.interest = BigInt.fromI32(0);
    user.totalPledged = BigInt.fromI32(0);
  }
  if (event.params.amount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance
      .plus(event.params.amount as BigInt)
      .plus(event.params.amount as BigInt);
    user.interest = user.interest.plus(event.params.amount as BigInt);
    user.totalPledged = user.totalPledged.minus(event.params.amount as BigInt);
    user.save();
  }
}

export function handleStaked(event: Staked): void {
  let entity = PledgeTypeStaked.load(event.params.pledgeId.toHex());
  if (entity == null) {
    entity = new PledgeTypeStaked(event.params.pledgeId.toHex());
    entity.pledgeId = event.params.pledgeId.toHex();
  }
  entity.pledgeId = event.params.pledgeId.toHex();
  const newItem = new UserPledgeType(event.transaction.hash.toHex());
  newItem.address = event.params.user.toHex();
  newItem.pledgeType = event.params.pledgeType.toI32();
  newItem.pledgeAmount = event.params.amount;

  let user = UserPledge.load(event.params.user.toHex());
  if (user == null) {
    user = new UserPledge(event.params.user.toHex());
    user.address = event.params.user.toHex();
    user.availableBalance = BigInt.fromI32(0);
    user.interest = BigInt.fromI32(0);
    user.totalPledged = BigInt.fromI32(0);
  }
  if (event.params.amount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance.minus(
      event.params.amount as BigInt
    );
    user.totalPledged = user.totalPledged.plus(event.params.amount as BigInt);
  }

  let currentPledge = new PledgeItem(event.params.pledgeId.toHex());
  currentPledge.pledgeId = event.params.pledgeId.toHex();
  currentPledge.pledgeType = event.params.pledgeType.toI32();
  currentPledge.pledgeAmount = event.params.amount;

  currentPledge.save();
  user.save();
  newItem.save();
  entity.save();
}

export function handleUnstaked(event: Unstaked): void {
  let user = UserPledge.load(event.params.user.toHex());

  if (user == null) {
    user = new UserPledge(event.params.user.toHex());
    user.address = event.params.user.toHex();
    user.availableBalance = BigInt.fromI32(0);
    user.interest = BigInt.fromI32(0);
    user.totalPledged = BigInt.fromI32(0);
  }

  let currentPledge = PledgeItem.load(event.params.pledgeId.toHex());
  if (currentPledge == null) {
    currentPledge = new PledgeItem(event.params.pledgeId.toHex());
    currentPledge.pledgeAmount = BigInt.fromI32(0);
  }

  if (currentPledge.pledgeAmount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance.plus(
      currentPledge.pledgeAmount as BigInt
    );
    user.totalPledged = user.totalPledged.minus(
      currentPledge.pledgeAmount as BigInt
    );
  }

  let currentPledgeTypeStaked = PledgeTypeStaked.load(
    event.params.pledgeId.toHex()
  );
  if (currentPledgeTypeStaked == null) {
    currentPledgeTypeStaked = new PledgeTypeStaked(
      event.params.pledgeId.toHex()
    );
    currentPledgeTypeStaked.pledgeId = event.params.pledgeId.toHex();
  }
  store.remove("PledgeTypeStaked", currentPledgeTypeStaked.id);

  let currentPledgeItem = PledgeItem.load(event.params.pledgeId.toHex());
  if (currentPledgeItem == null) {
    currentPledgeItem = new PledgeItem(event.params.pledgeId.toHex());
    currentPledgeItem.user = event.params.user.toHex();
    currentPledgeItem.pledgeId = event.params.pledgeId.toHex();
    currentPledgeItem.pledgeType = 3;
    currentPledgeItem.pledgeAmount = BigInt.fromI32(0);
  }
  store.remove("PledgeItem", currentPledgeItem.id);

  user.save();
}

export function handleUserWithdraw(event: UserWithdraw): void {
  let entity = new FrozenBalance(event.transaction.hash.toHex());
  let entity2 = UserPledge.load(event.params.user.toHex());
  if (entity2 == null) {
    entity2 = new UserPledge(event.params.user.toHex());
    entity2.availableBalance = BigInt.fromI32(0);
  }
  let availableBalance = entity2.availableBalance;
  entity.address = event.params.user.toHex();
  entity.amount = availableBalance;
  let sevenDaysInSeconds: BigInt = BigInt.fromI32(604800);
  entity.releaseTime = event.block.timestamp.plus(sevenDaysInSeconds);

  let user = UserPledge.load(event.params.user.toHex());
  if (user == null) {
    user = new UserPledge(event.params.user.toHex());
    user.address = event.params.user.toHex();
    user.availableBalance = BigInt.fromI32(0);
    user.interest = BigInt.fromI32(0);
    user.totalPledged = BigInt.fromI32(0);
  }
  user.availableBalance = BigInt.fromI32(0);

  user.save();
  entity.save();
}

// // Handle the UserAddInterest event
export function handleUserAddInterest(event: UserAddInterest): void {
  let user = UserPledge.load(event.params.user.toHex());
  if (user == null) {
    user = new UserPledge(event.params.user.toHex());
    user.address = event.params.user.toHex();
    user.availableBalance = BigInt.fromI32(0);
    user.interest = BigInt.fromI32(0);
    user.totalPledged = BigInt.fromI32(0);
  }
  if (event.params.amount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance.plus(
      event.params.amount as BigInt
    );
    user.interest = user.interest.plus(event.params.amount as BigInt);
    user.save();
  }
}
