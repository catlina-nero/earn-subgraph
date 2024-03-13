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
    user.totalPledged = BigInt.fromI32(0);
  }
  if (event.transaction.value != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance.plus(event.transaction.value);
  }
  user.save();
}

export function handleStakedBack(event: StakedBack): void {
  let user = UserPledge.load(event.params.user.toHex());
  if (user == null) {
    user = new UserPledge(event.params.user.toHex());
    user.totalPledged = BigInt.fromI32(0);
  }
  if (event.params.amount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance
      .plus(event.params.amount)
      .plus(event.params.amount);
    user.interest = user.interest.plus(event.params.amount);
    user.totalPledged = user.totalPledged.minus(event.params.amount);
    user.save();
  }
}

export function handleStaked(event: Staked): void {
  let entity = PledgeTypeStaked.load(event.params.pledgeId.toHex());
  if (entity == null) {
    entity = new PledgeTypeStaked(event.params.pledgeId.toHex());
  }
  entity.pledgeId = event.params.pledgeId.toHex();
  const newItem = new UserPledgeType(event.transaction.hash.toHex());
  newItem.address = event.params.user.toHex();
  newItem.pledgeType = event.params.pledgeType.toI32();
  newItem.pledgeAmount = event.params.amount;

  let user = UserPledge.load(event.params.user.toHex());
  if (event.params.amount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance.minus(event.params.amount);
    user.totalPledged = user.totalPledged.plus(event.params.amount);
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
  let currentPledge = PledgeItem.load(event.params.pledgeId.toHex());
  if (currentPledge.pledgeAmount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance.plus(
      currentPledge.pledgeAmount
    );
    user.totalPledged = user.totalPledged.minus(currentPledge.pledgeAmount);
  }

  let currentPledgeTypeStaked = PledgeTypeStaked.load(
    event.params.pledgeId.toHex()
  );
  store.remove("PledgeTypeStaked", currentPledgeTypeStaked.id);

  let currentPledgeItem = PledgeItem.load(event.params.pledgeId.toHex());
  store.remove("PledgeItem", currentPledgeItem.id);

  user.save();
}

export function handleUserWithdraw(event: UserWithdraw): void {
  let entity = new FrozenBalance(event.transaction.hash.toHex());
  let availableBalance = UserPledge.load(event.params.user.toHex())
    .availableBalance;
  entity.address = event.params.user.toHex();
  entity.amount = availableBalance;
  let d = BigInt.fromI32(60).times(BigInt.fromI32(60)).times(BigInt.fromI32(24)).times(BigInt.fromI32(7));
  entity.releaseTime = BigInt.fromI32(event.block.timestamp).plus(d);

  let user = UserPledge.load(event.params.user.toHex());
  user.availableBalance = BigInt.fromI32(0);

  user.save();
  entity.save();
}

// // Handle the UserAddInterest event
export function handleUserAddInterest(event: UserAddInterest): void {
  let user = UserPledge.load(event.params.user.toHex());
  if (event.params.amount != BigInt.fromI32(0)) {
    user.availableBalance = user.availableBalance.plus(event.params.amount);
    user.interest = user.interest.plus(event.params.amount);
    user.save();
  }
}
