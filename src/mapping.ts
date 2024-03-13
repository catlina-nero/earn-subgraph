import { BigInt } from "@graphprotocol/graph-ts"

import { User, DepositEvent, StakedEvent, UnstakedEvent, UserWithdrawEvent, UserWithdrawUnFrozenEvent, UserAddInterestEvent, StakedBackEvent } from "../generated/schema"

export function handleDeposit(event: DepositEvent): void {
  let entity = new DepositEvent(event.transaction.hash.toHex())
  let user = User.load(event.params.user.toHex())
  if (!user) {
    user = new User(event.params.user.toHex())
    user.availableBalance = BigInt.fromI32(0)
  }
  user.availableBalance = user.availableBalance.plus(event.params.amount)
  user.save()

  entity.amount = event.params.amount
  entity.user = user.id
  entity.timestamp = event.block.timestamp
  entity.save()
}

// 处理质押事件
export function handleStaked(event: StakedEvent): void {
  let entity = new StakedEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  let user = User.load(event.params.user.toHex())
  if (!user) {
    user = new User(event.params.user.toHex())
    // 初始化用户属性
  }
  // 更新用户属性，如质押金额
  user.save()

  entity.user = user.id
  entity.pledgeId = event.params.pledgeId
  entity.amount = event.params.amount
  entity.pledgeType = event.params.pledgeType
  entity.timestamp = event.block.timestamp
  entity.save()
}

// 处理解质押事件
export function handleUnstaked(event: UnstakedEvent): void {
  let entity = new UnstakedEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  let user = User.load(event.params.user.toHex())
  if (!user) {
    user = new User(event.params.user.toHex())
    // 初始化用户属性
  }
  // 更新用户属性，如解质押
  user.save()

  entity.pledgeId = event.params.pledgeId
  entity.user = user.id
  entity.amount = event.params.amount
  entity.pledgeType = event.params.pledgeType
  entity.timestamp = event.block.timestamp
  entity.save()
}

// 处理用户提款事件
export function handleUserWithdraw(event: UserWithdrawEvent): void {
  let entity = new UserWithdrawEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  let user = User.load(event.params.user.toHex())
  if (!user) {
    user = new User(event.params.user.toHex())
    // 初始化用户属性
  }
  // 更新用户可用余额等属性
  user.save()

  entity.user = user.id
  entity.amount = event.params.amount
  entity.timestamp = event.block.timestamp
  entity.save()
}

// 处理用户解冻提款事件
export function handleUserWithdrawUnFrozen(event: UserWithdrawUnFrozenEvent): void {
  let entity = new UserWithdrawUnFrozenEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  // 由于这个事件可能涉及多个解冻操作，可以考虑如何在模型中反映这一点
  entity.totalUnFrozen = event.params.totalUnFrozen
  entity.timestamp = event.block.timestamp
  entity.save()
}

// 处理添加利息事件
export function handleUserAddInterest(event: UserAddInterestEvent): void {
  let entity = new UserAddInterestEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  let user = User.load(event.params.user.toHex())
  if (!user) {
    user = new User(event.params.user.toHex())
    // 初始化用户属性
  }
  // 更新用户利息等属性
  user.save()

  entity.user = user.id
  entity.amount = event.params.amount
  entity.timestamp = event.block.timestamp
  entity.save()
}

// 处理质押金额退回事件
export function handleStakedBack(event: StakedBackEvent): void {
  let entity = new StakedBackEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  let user = User.load(event.params.user.toHex())
  if (!user) {
    user = new User(event.params.user.toHex())
    // 初始化用户属性
  }
  // 更新用户属性，如可用余额
  user.save()

  entity.pledgeId = event.params.pledgeId
  entity.user = user.id
  entity.amount = event.params.amount
  entity.pledgeType = event.params.pledgeType
  entity.timestamp = event.block.timestamp
  entity.save()
}
