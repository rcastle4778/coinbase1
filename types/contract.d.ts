import type { Abi, AbiFunction, AbiParametersToPrimitiveTypes, AbiStateMutability, Address, ExtractAbiFunction, ExtractAbiFunctionNames, ResolvedRegister } from "abitype";
import type { Hex } from "./misc";
import type { IsUnion, UnionToTuple } from "./utils";
export type ContractFunctionName<abi extends Abi | readonly unknown[] = Abi, mutability extends AbiStateMutability = AbiStateMutability> = ExtractAbiFunctionNames<abi extends Abi ? abi : Abi, mutability> extends infer functionName extends string ? [functionName] extends [never] ? string : functionName : string;
export type ContractFunctionArgs<abi extends Abi | readonly unknown[] = Abi, mutability extends AbiStateMutability = AbiStateMutability, functionName extends ContractFunctionName<abi, mutability> = ContractFunctionName<abi, mutability>> = AbiParametersToPrimitiveTypes<ExtractAbiFunction<abi extends Abi ? abi : Abi, functionName, mutability>["inputs"], "inputs"> extends infer args ? [args] extends [never] ? readonly unknown[] : args : readonly unknown[];
export type Widen<type> = ([unknown] extends [type] ? unknown : never) | (type extends Function ? type : never) | (type extends ResolvedRegister["BigIntType"] ? bigint : never) | (type extends boolean ? boolean : never) | (type extends ResolvedRegister["IntType"] ? number : never) | (type extends string ? type extends ResolvedRegister["AddressType"] ? ResolvedRegister["AddressType"] : type extends ResolvedRegister["BytesType"]["inputs"] ? ResolvedRegister["BytesType"] : string : never) | (type extends readonly [] ? readonly [] : never) | (type extends Record<string, unknown> ? {
    [K in keyof type]: Widen<type[K]>;
} : never) | (type extends {
    length: number;
} ? {
    [K in keyof type]: Widen<type[K]>;
} extends infer Val extends readonly unknown[] ? readonly [...Val] : never : never);
export type UnionWiden<type> = type extends any ? Widen<type> : never;
export type ExtractAbiFunctionForArgs<abi extends Abi, mutability extends AbiStateMutability, functionName extends ContractFunctionName<abi, mutability>, args extends ContractFunctionArgs<abi, mutability, functionName>> = ExtractAbiFunction<abi, functionName, mutability> extends infer abiFunction extends AbiFunction ? IsUnion<abiFunction> extends true ? UnionToTuple<abiFunction> extends infer abiFunctions extends readonly AbiFunction[] ? {
    [k in keyof abiFunctions]: CheckArgs<abiFunctions[k], args>;
}[number] : never : abiFunction : never;
type CheckArgs<abiFunction extends AbiFunction, args, targetArgs extends AbiParametersToPrimitiveTypes<abiFunction["inputs"], "inputs"> = AbiParametersToPrimitiveTypes<abiFunction["inputs"], "inputs">> = (readonly [] extends args ? readonly [] : args) extends targetArgs ? abiFunction : never;
export type ContractFunctionParameters<abi extends Abi | readonly unknown[] = Abi, mutability extends AbiStateMutability = AbiStateMutability, functionName extends ContractFunctionName<abi, mutability> = ContractFunctionName<abi, mutability>, args extends ContractFunctionArgs<abi, mutability, functionName> = ContractFunctionArgs<abi, mutability, functionName>, deployless extends boolean = false, allFunctionNames = ContractFunctionName<abi, mutability>, allArgs = ContractFunctionArgs<abi, mutability, functionName>> = {
    abi: abi;
    functionName: allFunctionNames | (functionName extends allFunctionNames ? functionName : never);
    args?: (abi extends Abi ? UnionWiden<args> : never) | allArgs | undefined;
} & (readonly [] extends allArgs ? {} : {
    args: Widen<args>;
}) & (deployless extends true ? {
    address?: undefined;
    code: Hex;
} : {
    address: Address;
});
export {};
