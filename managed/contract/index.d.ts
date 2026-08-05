import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  get_expense_amount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_group_expenses(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint[]];
}

export type ImpureCircuits<PS> = {
  initialize_group(context: __compactRuntime.CircuitContext<PS>,
                   debt_hash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settle_expense(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  batch_settle(context: __compactRuntime.CircuitContext<PS>,
               min_threshold_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verify_settlement_count(context: __compactRuntime.CircuitContext<PS>,
                          expected_count_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  initialize_group(context: __compactRuntime.CircuitContext<PS>,
                   debt_hash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settle_expense(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  batch_settle(context: __compactRuntime.CircuitContext<PS>,
               min_threshold_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verify_settlement_count(context: __compactRuntime.CircuitContext<PS>,
                          expected_count_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  initialize_group(context: __compactRuntime.CircuitContext<PS>,
                   debt_hash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settle_expense(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  batch_settle(context: __compactRuntime.CircuitContext<PS>,
               min_threshold_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verify_settlement_count(context: __compactRuntime.CircuitContext<PS>,
                          expected_count_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  readonly total_settled: bigint;
  readonly settlement_count: bigint;
  readonly group_debt_hash: Uint8Array;
  readonly is_initialized: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
