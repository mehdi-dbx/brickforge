import { i as __toDynamicImportESM, t as __commonJSMin } from "./chunk-CNPInK3f.mjs";
import { t as require_token_error } from "./token-error-DEGK1hpu.mjs";
import { r as getHostUrl } from "./src-DgB1I3Ns.mjs";
import { i as getCachedCliHost, o as getDatabricksToken, s as getDatabricksUserIdentity, t as getAuthMethod } from "./src-CfAHTh4v.mjs";
import { randomUUID } from "node:crypto";

//#region ../node_modules/@ai-sdk/provider/dist/index.mjs
var marker$2 = "vercel.ai.error";
var symbol$3 = Symbol.for(marker$2);
var _a$4, _b$2;
var AISDKError = class _AISDKError extends (_b$2 = Error, _a$4 = symbol$3, _b$2) {
	/**
	* Creates an AI SDK Error.
	*
	* @param {Object} params - The parameters for creating the error.
	* @param {string} params.name - The name of the error.
	* @param {string} params.message - The error message.
	* @param {unknown} [params.cause] - The underlying cause of the error.
	*/
	constructor({ name: name14$1, message, cause }) {
		super(message);
		this[_a$4] = true;
		this.name = name14$1;
		this.cause = cause;
	}
	/**
	* Checks if the given error is an AI SDK Error.
	* @param {unknown} error - The error to check.
	* @returns {boolean} True if the error is an AI SDK Error, false otherwise.
	*/
	static isInstance(error) {
		return _AISDKError.hasMarker(error, marker$2);
	}
	static hasMarker(error, marker15$1) {
		const markerSymbol = Symbol.for(marker15$1);
		return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
	}
};
var name$3 = "AI_APICallError";
var marker2$2 = `vercel.ai.error.${name$3}`;
var symbol2$2 = Symbol.for(marker2$2);
var _a2$2, _b2$1;
var APICallError = class extends (_b2$1 = AISDKError, _a2$2 = symbol2$2, _b2$1) {
	constructor({ message, url, requestBodyValues, statusCode, responseHeaders, responseBody, cause, isRetryable = statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500), data }) {
		super({
			name: name$3,
			message,
			cause
		});
		this[_a2$2] = true;
		this.url = url;
		this.requestBodyValues = requestBodyValues;
		this.statusCode = statusCode;
		this.responseHeaders = responseHeaders;
		this.responseBody = responseBody;
		this.isRetryable = isRetryable;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker2$2);
	}
};
var name2$2 = "AI_EmptyResponseBodyError";
var marker3$2 = `vercel.ai.error.${name2$2}`;
var symbol3$2 = Symbol.for(marker3$2);
var _a3$2, _b3$1;
var EmptyResponseBodyError = class extends (_b3$1 = AISDKError, _a3$2 = symbol3$2, _b3$1) {
	constructor({ message = "Empty response body" } = {}) {
		super({
			name: name2$2,
			message
		});
		this[_a3$2] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3$2);
	}
};
function getErrorMessage$1(error) {
	if (error == null) return "unknown error";
	if (typeof error === "string") return error;
	if (error instanceof Error) return error.message;
	return JSON.stringify(error);
}
var name3$2 = "AI_InvalidArgumentError";
var marker4$2 = `vercel.ai.error.${name3$2}`;
var symbol4$2 = Symbol.for(marker4$2);
var _a4$2, _b4$1;
var InvalidArgumentError$1 = class extends (_b4$1 = AISDKError, _a4$2 = symbol4$2, _b4$1) {
	constructor({ message, cause, argument }) {
		super({
			name: name3$2,
			message,
			cause
		});
		this[_a4$2] = true;
		this.argument = argument;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4$2);
	}
};
var name4$2 = "AI_InvalidPromptError";
var marker5$2 = `vercel.ai.error.${name4$2}`;
var symbol5$2 = Symbol.for(marker5$2);
var _a5$2, _b5$1;
var InvalidPromptError = class extends (_b5$1 = AISDKError, _a5$2 = symbol5$2, _b5$1) {
	constructor({ prompt, message, cause }) {
		super({
			name: name4$2,
			message: `Invalid prompt: ${message}`,
			cause
		});
		this[_a5$2] = true;
		this.prompt = prompt;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker5$2);
	}
};
var name5$2 = "AI_InvalidResponseDataError";
var marker6$2 = `vercel.ai.error.${name5$2}`;
var symbol6$2 = Symbol.for(marker6$2);
var name6$2 = "AI_JSONParseError";
var marker7$2 = `vercel.ai.error.${name6$2}`;
var symbol7$2 = Symbol.for(marker7$2);
var _a7$2, _b7$1;
var JSONParseError = class extends (_b7$1 = AISDKError, _a7$2 = symbol7$2, _b7$1) {
	constructor({ text: text$1, cause }) {
		super({
			name: name6$2,
			message: `JSON parsing failed: Text: ${text$1}.
Error message: ${getErrorMessage$1(cause)}`,
			cause
		});
		this[_a7$2] = true;
		this.text = text$1;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker7$2);
	}
};
var name7$1 = "AI_LoadAPIKeyError";
var marker8$1 = `vercel.ai.error.${name7$1}`;
var symbol8$1 = Symbol.for(marker8$1);
var name8$1 = "AI_LoadSettingError";
var marker9$1 = `vercel.ai.error.${name8$1}`;
var symbol9$1 = Symbol.for(marker9$1);
var name9$1 = "AI_NoContentGeneratedError";
var marker10$1 = `vercel.ai.error.${name9$1}`;
var symbol10$1 = Symbol.for(marker10$1);
var name10$1 = "AI_NoSuchModelError";
var marker11$1 = `vercel.ai.error.${name10$1}`;
var symbol11$1 = Symbol.for(marker11$1);
var name11$1 = "AI_TooManyEmbeddingValuesForCallError";
var marker12$1 = `vercel.ai.error.${name11$1}`;
var symbol12$1 = Symbol.for(marker12$1);
var name12$1 = "AI_TypeValidationError";
var marker13$1 = `vercel.ai.error.${name12$1}`;
var symbol13$1 = Symbol.for(marker13$1);
var _a13$1, _b13;
var TypeValidationError = class _TypeValidationError extends (_b13 = AISDKError, _a13$1 = symbol13$1, _b13) {
	constructor({ value, cause, context: context$1 }) {
		let contextPrefix = "Type validation failed";
		if (context$1 == null ? void 0 : context$1.field) contextPrefix += ` for ${context$1.field}`;
		if ((context$1 == null ? void 0 : context$1.entityName) || (context$1 == null ? void 0 : context$1.entityId)) {
			contextPrefix += " (";
			const parts = [];
			if (context$1.entityName) parts.push(context$1.entityName);
			if (context$1.entityId) parts.push(`id: "${context$1.entityId}"`);
			contextPrefix += parts.join(", ");
			contextPrefix += ")";
		}
		super({
			name: name12$1,
			message: `${contextPrefix}: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage$1(cause)}`,
			cause
		});
		this[_a13$1] = true;
		this.value = value;
		this.context = context$1;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker13$1);
	}
	/**
	* Wraps an error into a TypeValidationError.
	* If the cause is already a TypeValidationError with the same value and context, it returns the cause.
	* Otherwise, it creates a new TypeValidationError.
	*
	* @param {Object} params - The parameters for wrapping the error.
	* @param {unknown} params.value - The value that failed validation.
	* @param {unknown} params.cause - The original error or cause of the validation failure.
	* @param {TypeValidationContext} params.context - Optional context about what is being validated.
	* @returns {TypeValidationError} A TypeValidationError instance.
	*/
	static wrap({ value, cause, context: context$1 }) {
		var _a15$1, _b15, _c;
		if (_TypeValidationError.isInstance(cause) && cause.value === value && ((_a15$1 = cause.context) == null ? void 0 : _a15$1.field) === (context$1 == null ? void 0 : context$1.field) && ((_b15 = cause.context) == null ? void 0 : _b15.entityName) === (context$1 == null ? void 0 : context$1.entityName) && ((_c = cause.context) == null ? void 0 : _c.entityId) === (context$1 == null ? void 0 : context$1.entityId)) return cause;
		return new _TypeValidationError({
			value,
			cause,
			context: context$1
		});
	}
};
var name13$1 = "AI_UnsupportedFunctionalityError";
var marker14$1 = `vercel.ai.error.${name13$1}`;
var symbol14$1 = Symbol.for(marker14$1);
var _a14$1, _b14;
var UnsupportedFunctionalityError = class extends (_b14 = AISDKError, _a14$1 = symbol14$1, _b14) {
	constructor({ functionality, message = `'${functionality}' functionality not supported.` }) {
		super({
			name: name13$1,
			message
		});
		this[_a14$1] = true;
		this.functionality = functionality;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker14$1);
	}
};

//#endregion
//#region ../node_modules/zod/v4/core/core.js
/** A special constant with type `never` */
const NEVER = Object.freeze({ status: "aborted" });
function $constructor(name$4, initializer$2, params) {
	function init(inst, def) {
		if (!inst._zod) Object.defineProperty(inst, "_zod", {
			value: {
				def,
				constr: _,
				traits: /* @__PURE__ */ new Set()
			},
			enumerable: false
		});
		if (inst._zod.traits.has(name$4)) return;
		inst._zod.traits.add(name$4);
		initializer$2(inst, def);
		const proto = _.prototype;
		const keys = Object.keys(proto);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name$4 });
	function _(def) {
		var _a$5;
		const inst = params?.Parent ? new Definition() : this;
		init(inst, def);
		(_a$5 = inst._zod).deferred ?? (_a$5.deferred = []);
		for (const fn of inst._zod.deferred) fn();
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name$4);
	} });
	Object.defineProperty(_, "name", { value: name$4 });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name$4) {
		super(`Encountered unidirectional transform during encode: ${name$4}`);
		this.name = "ZodEncodeError";
	}
};
const globalConfig = {};
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}

//#endregion
//#region ../node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
function cached(getter) {
	return { get value() {
		{
			const value = getter();
			Object.defineProperty(this, "value", { value });
			return value;
		}
		throw new Error("cached value already set");
	} };
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder$1(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepString = step.toString();
	let stepDecCount = (stepString.split(".")[1] || "").length;
	if (stepDecCount === 0 && /\d?e-\d?/.test(stepString)) {
		const match = stepString.match(/\d?e-(\d?)/);
		if (match?.[1]) stepDecCount = Number.parseInt(match[1]);
	}
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
const EVALUATING = Symbol("evaluating");
function defineLazy(object$2, key, getter) {
	let value = void 0;
	Object.defineProperty(object$2, key, {
		get() {
			if (value === EVALUATING) return;
			if (value === void 0) {
				value = EVALUATING;
				value = getter();
			}
			return value;
		},
		set(v) {
			Object.defineProperty(object$2, key, { value: v });
		},
		configurable: true
	});
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = cached(() => {
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	return o;
}
const propertyKeyTypes = new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = {
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = {};
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				newShape[key] = currDef.shape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = { ...schema._zod.def.shape };
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				delete newShape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = schema._zod.def.shape;
		for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function merge(a, b) {
	return clone(a, mergeDefs(a._zod.def, {
		get shape() {
			const _shape = {
				...a._zod.def.shape,
				...b._zod.def.shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: []
	}));
}
function partial(Class, schema, mask) {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const oldShape = schema._zod.def.shape;
			const shape = { ...oldShape };
			if (mask) for (const key in mask) {
				if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				shape[key] = Class ? new Class({
					type: "optional",
					innerType: oldShape[key]
				}) : oldShape[key];
			}
			else for (const key in oldShape) shape[key] = Class ? new Class({
				type: "optional",
				innerType: oldShape[key]
			}) : oldShape[key];
			assignProp(this, "shape", shape);
			return shape;
		},
		checks: []
	}));
}
function required(Class, schema, mask) {
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const oldShape = schema._zod.def.shape;
		const shape = { ...oldShape };
		if (mask) for (const key in mask) {
			if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
			if (!mask[key]) continue;
			shape[key] = new Class({
				type: "nonoptional",
				innerType: oldShape[key]
			});
		}
		else for (const key in oldShape) shape[key] = new Class({
			type: "nonoptional",
			innerType: oldShape[key]
		});
		assignProp(this, "shape", shape);
		return shape;
	} }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a$5;
		(_a$5 = iss).path ?? (_a$5.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config$1) {
	const full = {
		...iss,
		path: iss.path ?? []
	};
	if (!iss.message) full.message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config$1.customError?.(iss)) ?? unwrapMessage(config$1.localeError?.(iss)) ?? "Invalid input";
	delete full.inst;
	delete full.continue;
	if (!ctx?.reportInput) delete full.input;
	return full;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}

//#endregion
//#region ../node_modules/zod/v4/core/errors.js
const initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	Object.defineProperty(inst, "_zod", {
		value: inst._zod,
		enumerable: false
	});
	Object.defineProperty(inst, "issues", {
		value: def,
		enumerable: false
	});
	inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
	Object.defineProperty(inst, "toString", {
		value: () => inst.message,
		enumerable: false
	});
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue$1) => issue$1.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) {
		fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
		fieldErrors[sub.path[0]].push(mapper(sub));
	} else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue$1) => issue$1.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error$1) => {
		for (const issue$1 of error$1.issues) if (issue$1.code === "invalid_union" && issue$1.errors.length) issue$1.errors.map((issues) => processError({ issues }));
		else if (issue$1.code === "invalid_key") processError({ issues: issue$1.issues });
		else if (issue$1.code === "invalid_element") processError({ issues: issue$1.issues });
		else if (issue$1.path.length === 0) fieldErrors._errors.push(mapper(issue$1));
		else {
			let curr = fieldErrors;
			let i = 0;
			while (i < issue$1.path.length) {
				const el = issue$1.path[i];
				if (!(i === issue$1.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
				else {
					curr[el] = curr[el] || { _errors: [] };
					curr[el]._errors.push(mapper(issue$1));
				}
				curr = curr[el];
				i++;
			}
		}
	};
	processError(error);
	return fieldErrors;
}

//#endregion
//#region ../node_modules/zod/v4/core/parse.js
const _parse$1 = (_Err) => (schema, value, _ctx, _params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	if (result.issues.length) {
		const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, _params?.callee);
		throw e;
	}
	return result.value;
};
const parse$1 = /* @__PURE__ */ _parse$1($ZodRealError);
const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	if (result.issues.length) {
		const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, params?.callee);
		throw e;
	}
	return result.value;
};
const parseAsync$1 = /* @__PURE__ */ _parseAsync($ZodRealError);
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? {
		success: false,
		error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParse$1 = /* @__PURE__ */ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? {
		success: false,
		error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParseAsync$1 = /* @__PURE__ */ _safeParseAsync($ZodRealError);
const _encode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _parse$1(_Err)(schema, value, ctx);
};
const encode$1 = /* @__PURE__ */ _encode($ZodRealError);
const _decode = (_Err) => (schema, value, _ctx) => {
	return _parse$1(_Err)(schema, value, _ctx);
};
const decode$1 = /* @__PURE__ */ _decode($ZodRealError);
const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _parseAsync(_Err)(schema, value, ctx);
};
const encodeAsync$1 = /* @__PURE__ */ _encodeAsync($ZodRealError);
const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _parseAsync(_Err)(schema, value, _ctx);
};
const decodeAsync$1 = /* @__PURE__ */ _decodeAsync($ZodRealError);
const _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
const safeEncode$1 = /* @__PURE__ */ _safeEncode($ZodRealError);
const _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
const safeDecode$1 = /* @__PURE__ */ _safeDecode($ZodRealError);
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
const safeEncodeAsync$1 = /* @__PURE__ */ _safeEncodeAsync($ZodRealError);
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
const safeDecodeAsync$1 = /* @__PURE__ */ _safeDecodeAsync($ZodRealError);

//#endregion
//#region ../node_modules/zod/v4/core/regexes.js
const cuid = /^[cC][^\s-]{8,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid = (version$1) => {
	if (!version$1) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return /* @__PURE__ */ new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version$1}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^[A-Za-z0-9_-]*$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
const date$1 = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time$1(args) {
	return /* @__PURE__ */ new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
	const time$2 = timeSource({ precision: args.precision });
	const opts = ["Z"];
	if (args.local) opts.push("");
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const timeRegex$1 = `${time$2}(?:${opts.join("|")})`;
	return /* @__PURE__ */ new RegExp(`^${dateSource}T(?:${timeRegex$1})$`);
}
const string$1 = (params) => {
	const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
	return /* @__PURE__ */ new RegExp(`^${regex}$`);
};
const integer = /^-?\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const boolean$1 = /^(?:true|false)$/i;
const _null$2 = /^null$/i;
const _undefined$2 = /^undefined$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;

//#endregion
//#region ../node_modules/zod/v4/core/checks.js
const $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
	var _a$5;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a$5 = inst._zod).onattach ?? (_a$5.onattach = []);
});
const numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
		if (def.value < curr) if (def.inclusive) bag.maximum = def.value;
		else bag.exclusiveMaximum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
		if (def.value > curr) if (def.inclusive) bag.minimum = def.value;
		else bag.exclusiveMinimum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst$1) => {
		var _a$5;
		(_a$5 = inst$1._zod.bag).multipleOf ?? (_a$5.multipleOf = def.value);
	});
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder$1(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.format = def.format;
		bag.minimum = minimum;
		bag.maximum = maximum;
		if (isInt) bag.pattern = integer;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a$5;
	$ZodCheck.init(inst, def);
	(_a$5 = inst._zod.def).when ?? (_a$5.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst$1) => {
		const curr = inst$1._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
		if (def.maximum < curr) inst$1._zod.bag.maximum = def.maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a$5;
	$ZodCheck.init(inst, def);
	(_a$5 = inst._zod.def).when ?? (_a$5.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst$1) => {
		const curr = inst$1._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
		if (def.minimum > curr) inst$1._zod.bag.minimum = def.minimum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a$5;
	$ZodCheck.init(inst, def);
	(_a$5 = inst._zod.def).when ?? (_a$5.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.minimum = def.length;
		bag.maximum = def.length;
		bag.length = def.length;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const length = input.length;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a$5, _b$3;
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.format = def.format;
		if (def.pattern) {
			bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
			bag.patterns.add(def.pattern);
		}
	});
	if (def.pattern) (_a$5 = inst._zod).check ?? (_a$5.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b$3 = inst._zod).check ?? (_b$3.check = () => {});
});
const $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
	def.pattern = pattern;
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = /* @__PURE__ */ new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = /* @__PURE__ */ new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});

//#endregion
//#region ../node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = []) {
		this.content = [];
		this.indent = 0;
		if (this) this.args = args;
	}
	indented(fn) {
		this.indent += 1;
		fn(this);
		this.indent -= 1;
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const args = this?.args;
		const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
		return new F(...args, lines.join("\n"));
	}
};

//#endregion
//#region ../node_modules/zod/v4/core/versions.js
const version = {
	major: 4,
	minor: 3,
	patch: 6
};

//#endregion
//#region ../node_modules/zod/v4/core/schemas.js
const $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
	var _a$5;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const checks = [...inst._zod.def.checks ?? []];
	if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a$5 = inst._zod).deferred ?? (_a$5.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks$1, ctx) => {
			let isAborted$1 = aborted(payload);
			let asyncResult;
			for (const ch of checks$1) {
				if (ch._zod.def.when) {
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted$1) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					if (!isAborted$1) isAborted$1 = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					if (!isAborted$1) isAborted$1 = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult$1) => inst._zod.parse(checkResult$1, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary$1) => {
					return handleCanaryResult(canary$1, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result$1) => runChecks(result$1, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
	defineLazy(inst, "~standard", () => ({
		validate: (value) => {
			try {
				const r = safeParse$1(inst, value);
				return r.success ? { value: r.data } : { issues: r.error?.issues };
			} catch (_) {
				return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	}));
});
const $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_$1) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
const $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = new URL(trimmed);
			if (def.hostname) {
				def.hostname.lastIndex = 0;
				if (!def.hostname.test(url.hostname)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid hostname",
					pattern: def.hostname.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.protocol) {
				def.protocol.lastIndex = 0;
				if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid protocol",
					pattern: def.protocol.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.normalize) payload.value = url.href;
			else payload.value = trimmed;
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
	def.pattern ?? (def.pattern = nanoid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime$1(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time$1(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv4`;
});
const $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv6`;
	inst._zod.check = (payload) => {
		try {
			new URL(`http://[${payload.value}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "ipv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
const $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		const parts = payload.value.split("/");
		try {
			if (parts.length !== 2) throw new Error();
			const [address, prefix] = parts;
			if (!prefix) throw new Error();
			const prefixNum = Number(prefix);
			if (`${prefixNum}` !== prefix) throw new Error();
			if (prefixNum < 0 || prefixNum > 128) throw new Error();
			new URL(`http://[${address}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "cidrv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64";
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64URL(data) {
	if (!base64url.test(data)) return false;
	const base64$1 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64$1.padEnd(Math.ceil(base64$1.length / 4) * 4, "="));
}
const $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64url);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64url";
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT$1(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT$1(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = _undefined$2;
	inst._zod.values = new Set([void 0]);
	inst._zod.optin = "optional";
	inst._zod.optout = "optional";
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (typeof input === "undefined") return payload;
		payload.issues.push({
			expected: "undefined",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = _null$2;
	inst._zod.values = new Set([null]);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (input === null) return payload;
		payload.issues.push({
			expected: "null",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = Array(input.length);
		const proms = [];
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result$1) => handleArrayResult(result$1, payload, i)));
			else handleArrayResult(result, payload, i);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handlePropertyResult(result, final, key, input, isOptionalOut) {
	if (result.issues.length) {
		if (isOptionalOut && !(key in input)) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (result.value === void 0) {
		if (key in input) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	for (const k of keys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		keys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const isOptionalOut = _catchall.optout === "optional";
	for (const key in input) {
		if (keySet.has(key)) continue;
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r$1) => handlePropertyResult(r$1, payload, key, input, isOptionalOut)));
		else handlePropertyResult(r, payload, key, input, isOptionalOut);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
const $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
		const sh = def.shape;
		Object.defineProperty(def, "shape", { get: () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			return newSh;
		} });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazy(inst._zod, "propValues", () => {
		const shape = def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = {};
		const proms = [];
		const shape = value.shape;
		for (const key of value.keys) {
			const el = shape[key];
			const isOptionalOut = el._zod.optout === "optional";
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r$1) => handlePropertyResult(r$1, payload, key, input, isOptionalOut)));
			else handlePropertyResult(r, payload, key, input, isOptionalOut);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
	};
});
const $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const generateFastpass = (shape) => {
		const doc = new Doc([
			"shape",
			"payload",
			"ctx"
		]);
		const normalized = _normalized.value;
		const parseStr = (key) => {
			const k = esc(key);
			return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		};
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.keys) ids[key] = `key_${counter++}`;
		doc.write(`const newResult = {};`);
		for (const key of normalized.keys) {
			const id = ids[key];
			const k = esc(key);
			const isOptionalOut = shape[key]?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(key)};`);
			if (isOptionalOut) doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
			else doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		const fn = doc.compile();
		return (payload, ctx) => fn(shape, payload, ctx);
	};
	let fastpass;
	const isObject$1 = isObject;
	const jit = !globalConfig.jitless;
	const allowsEval$1 = allowsEval;
	const fastEnabled = jit && allowsEval$1.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "values", () => {
		if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazy(inst._zod, "pattern", () => {
		if (def.options.every((o) => o._zod.pattern)) {
			const patterns = def.options.map((o) => o._zod.pattern);
			return /* @__PURE__ */ new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const single = def.options.length === 1;
	const first = def.options[0]._zod.run;
	inst._zod.parse = (payload, ctx) => {
		if (single) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results$1) => {
			return handleUnionResults(results$1, payload, inst, ctx);
		});
	};
});
const $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
	def.inclusive = false;
	$ZodUnion.init(inst, def);
	const _super = inst._zod.parse;
	defineLazy(inst._zod, "propValues", () => {
		const propValues = {};
		for (const option of def.options) {
			const pv = option._zod.propValues;
			if (!pv || Object.keys(pv).length === 0) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
			for (const [k, v] of Object.entries(pv)) {
				if (!propValues[k]) propValues[k] = /* @__PURE__ */ new Set();
				for (const val of v) propValues[k].add(val);
			}
		}
		return propValues;
	});
	const disc = cached(() => {
		const opts = def.options;
		const map = /* @__PURE__ */ new Map();
		for (const o of opts) {
			const values = o._zod.propValues?.[def.discriminator];
			if (!values || values.size === 0) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
			for (const v of values) {
				if (map.has(v)) throw new Error(`Duplicate discriminator value "${String(v)}"`);
				map.set(v, o);
			}
		}
		return map;
	});
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isObject(input)) {
			payload.issues.push({
				code: "invalid_type",
				expected: "object",
				input,
				inst
			});
			return payload;
		}
		const opt = disc.value.get(input?.[def.discriminator]);
		if (opt) return opt._zod.run(payload, ctx);
		if (def.unionFallback) return _super(payload, ctx);
		payload.issues.push({
			code: "invalid_union",
			errors: [],
			note: "No matching discriminator",
			discriminator: def.discriminator,
			input,
			path: [def.discriminator],
			inst
		});
		return payload;
	};
});
const $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left$1, right$1]) => {
			return handleIntersectionResults(payload, left$1, right$1);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues$1(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues$1(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues$1(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	for (const iss of left.issues) if (iss.code === "unrecognized_keys") {
		unrecIssue ?? (unrecIssue = iss);
		for (const k of iss.keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k).l = true;
		}
	} else result.issues.push(iss);
	for (const iss of right.issues) if (iss.code === "unrecognized_keys") for (const k of iss.keys) {
		if (!unrecKeys.has(k)) unrecKeys.set(k, {});
		unrecKeys.get(k).r = true;
	}
	else result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length && unrecIssue) result.issues.push({
		...unrecIssue,
		keys: bothKeys
	});
	if (aborted(result)) return result;
	const merged = mergeValues$1(left.value, right.value);
	if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	result.value = merged.data;
	return result;
}
const $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isPlainObject(input)) {
			payload.issues.push({
				expected: "record",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		const values = def.keyType._zod.values;
		if (values) {
			payload.value = {};
			const recordKeys = /* @__PURE__ */ new Set();
			for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
				recordKeys.add(typeof key === "number" ? key.toString() : key);
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result$1) => {
					if (result$1.issues.length) payload.issues.push(...prefixIssues(key, result$1.issues));
					payload.value[key] = result$1.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[key] = result.value;
				}
			}
			let unrecognized;
			for (const key in input) if (!recordKeys.has(key)) {
				unrecognized = unrecognized ?? [];
				unrecognized.push(key);
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized
			});
		} else {
			payload.value = {};
			for (const key of Reflect.ownKeys(input)) {
				if (key === "__proto__") continue;
				let keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
					const retryResult = def.keyType._zod.run({
						value: Number(key),
						issues: []
					}, ctx);
					if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (retryResult.issues.length === 0) keyResult = retryResult;
				}
				if (keyResult.issues.length) {
					if (def.mode === "loose") payload.value[key] = input[key];
					else payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result$1) => {
					if (result$1.issues.length) payload.issues.push(...prefixIssues(key, result$1.issues));
					payload.value[keyResult.value] = result$1.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[keyResult.value] = result.value;
				}
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
const $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	inst._zod.pattern = /* @__PURE__ */ new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	if (def.values.length === 0) throw new Error("Cannot create literal schema with no valid values");
	const values = new Set(def.values);
	inst._zod.values = values;
	inst._zod.pattern = /* @__PURE__ */ new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(result, input) {
	if (result.issues.length && input === void 0) return {
		issues: [],
		value: void 0
	};
	return result;
}
const $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	inst._zod.optout = "optional";
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, void 0]) : void 0;
	});
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? /* @__PURE__ */ new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (def.innerType._zod.optin === "optional") {
			const result = def.innerType._zod.run(payload, ctx);
			if (result instanceof Promise) return result.then((r) => handleOptionalResult(r, payload.value));
			return handleOptionalResult(result, payload.value);
		}
		if (payload.value === void 0) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? /* @__PURE__ */ new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result$1) => handleDefaultResult(result$1, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => {
		const v = def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result$1) => handleNonOptionalResult(result$1, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
const $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result$1) => {
			payload.value = result$1.value;
			if (result$1.issues.length) {
				payload.value = def.catchValue({
					...payload,
					error: { issues: result$1.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
					input: payload.value
				});
				payload.issues = [];
			}
			return payload;
		});
		payload.value = result.value;
		if (result.issues.length) {
			payload.value = def.catchValue({
				...payload,
				error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
				input: payload.value
			});
			payload.issues = [];
		}
		return payload;
	};
});
const $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => def.in._zod.values);
	defineLazy(inst._zod, "optin", () => def.in._zod.optin);
	defineLazy(inst._zod, "optout", () => def.out._zod.optout);
	defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right$1) => handlePipeResult(right$1, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left$1) => handlePipeResult(left$1, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.length) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
	defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "innerType", () => def.getter());
	defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
	defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
	defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? void 0);
	defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? void 0);
	inst._zod.parse = (payload, ctx) => {
		return inst._zod.innerType._zod.run(payload, ctx);
	};
});
const $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r$1) => handleRefineResult(r$1, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}

//#endregion
//#region ../node_modules/zod/v4/core/registries.js
var _a$3;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta$2 = _meta[0];
		this._map.set(schema, meta$2);
		if (meta$2 && typeof meta$2 === "object" && "id" in meta$2) this._idmap.set(meta$2.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta$2 = this._map.get(schema);
		if (meta$2 && typeof meta$2 === "object" && "id" in meta$2) this._idmap.delete(meta$2.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a$3 = globalThis).__zod_globalRegistry ?? (_a$3.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;

//#endregion
//#region ../node_modules/zod/v4/core/api.js
/* @__NO_SIDE_EFFECTS__ */
function _string(Class, params) {
	return new Class({
		type: "string",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _number(Class, params) {
	return new Class({
		type: "number",
		checks: [],
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _undefined$1(Class, params) {
	return new Class({
		type: "undefined",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _null$1(Class, params) {
	return new Class({
		type: "null",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _any(Class) {
	return new Class({ type: "any" });
}
/* @__NO_SIDE_EFFECTS__ */
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
/* @__NO_SIDE_EFFECTS__ */
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
/* @__NO_SIDE_EFFECTS__ */
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
/* @__NO_SIDE_EFFECTS__ */
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
/* @__NO_SIDE_EFFECTS__ */
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _custom(Class, fn, _params) {
	const norm = normalizeParams(_params);
	norm.abort ?? (norm.abort = true);
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...norm
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _superRefine(fn) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	});
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function describe$1(description) {
	const ch = new $ZodCheck({ check: "describe" });
	ch._zod.onattach = [(inst) => {
		const existing = globalRegistry.get(inst) ?? {};
		globalRegistry.add(inst, {
			...existing,
			description
		});
	}];
	ch._zod.check = () => {};
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function meta$1(metadata) {
	const ch = new $ZodCheck({ check: "meta" });
	ch._zod.onattach = [(inst) => {
		const existing = globalRegistry.get(inst) ?? {};
		globalRegistry.add(inst, {
			...existing,
			...metadata
		});
	}];
	ch._zod.check = () => {};
	return ch;
}

//#endregion
//#region ../node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		external: params?.external ?? void 0
	};
}
function process$1(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a$5;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			process$1(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta$2 = ctx.metadataRegistry.get(schema);
	if (meta$2) Object.assign(result.schema, meta$2);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && result.schema._prefault) (_a$5 = result.schema).default ?? (_a$5.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id$1) => id$1);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
			};
		}
		if (entry[1] === root) return { ref: "#" };
		const defUriPrefix = `#/${defsSegment}/`;
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + defId
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema$1 = seen.schema;
		for (const key in schema$1) delete schema$1[key];
		schema$1.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") {
				extractToDef(entry);
				continue;
			}
		}
	}
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema$1) => {
		const seen = ctx.seen.get(zodSchema$1);
		if (seen.ref === null) return;
		const schema$1 = seen.def ?? seen.schema;
		const _cached = { ...schema$1 };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema$1.allOf = schema$1.allOf ?? [];
				schema$1.allOf.push(refSchema);
			} else Object.assign(schema$1, refSchema);
			Object.assign(schema$1, _cached);
			if (zodSchema$1._zod.parent === ref) for (const key in schema$1) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema$1[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema$1) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema$1[key]) === JSON.stringify(refSeen.def[key])) delete schema$1[key];
			}
		}
		const parent = zodSchema$1._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema$1.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema$1) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema$1[key]) === JSON.stringify(parentSeen.def[key])) delete schema$1[key];
				}
			}
		}
		ctx.override({
			zodSchema: zodSchema$1,
			jsonSchema: schema$1,
			path: seen.path ?? []
		});
	};
	for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	Object.assign(result, root.def ?? root.schema);
	const defs = ctx.external?.defs ?? {};
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) defs[seen.defId] = seen.def;
	}
	if (ctx.external) {} else if (Object.keys(defs).length > 0) if (ctx.target === "draft-2020-12") result.$defs = defs;
	else result.definitions = defs;
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};

//#endregion
//#region ../node_modules/zod/v4/core/json-schema-processors.js
const formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
const stringProcessor = (schema, ctx, _json, _params) => {
	const json$1 = _json;
	json$1.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
	if (typeof minimum === "number") json$1.minLength = minimum;
	if (typeof maximum === "number") json$1.maxLength = maximum;
	if (format) {
		json$1.format = formatMap[format] ?? format;
		if (json$1.format === "") delete json$1.format;
		if (format === "time") delete json$1.format;
	}
	if (contentEncoding) json$1.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const regexes = [...patterns];
		if (regexes.length === 1) json$1.pattern = regexes[0].source;
		else if (regexes.length > 1) json$1.allOf = [...regexes.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
const numberProcessor = (schema, ctx, _json, _params) => {
	const json$1 = _json;
	const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
	if (typeof format === "string" && format.includes("int")) json$1.type = "integer";
	else json$1.type = "number";
	if (typeof exclusiveMinimum === "number") if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
		json$1.minimum = exclusiveMinimum;
		json$1.exclusiveMinimum = true;
	} else json$1.exclusiveMinimum = exclusiveMinimum;
	if (typeof minimum === "number") {
		json$1.minimum = minimum;
		if (typeof exclusiveMinimum === "number" && ctx.target !== "draft-04") if (exclusiveMinimum >= minimum) delete json$1.minimum;
		else delete json$1.exclusiveMinimum;
	}
	if (typeof exclusiveMaximum === "number") if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
		json$1.maximum = exclusiveMaximum;
		json$1.exclusiveMaximum = true;
	} else json$1.exclusiveMaximum = exclusiveMaximum;
	if (typeof maximum === "number") {
		json$1.maximum = maximum;
		if (typeof exclusiveMaximum === "number" && ctx.target !== "draft-04") if (exclusiveMaximum <= maximum) delete json$1.maximum;
		else delete json$1.exclusiveMaximum;
	}
	if (typeof multipleOf === "number") json$1.multipleOf = multipleOf;
};
const booleanProcessor = (_schema, _ctx, json$1, _params) => {
	json$1.type = "boolean";
};
const bigintProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("BigInt cannot be represented in JSON Schema");
};
const symbolProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Symbols cannot be represented in JSON Schema");
};
const nullProcessor = (_schema, ctx, json$1, _params) => {
	if (ctx.target === "openapi-3.0") {
		json$1.type = "string";
		json$1.nullable = true;
		json$1.enum = [null];
	} else json$1.type = "null";
};
const undefinedProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Undefined cannot be represented in JSON Schema");
};
const voidProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Void cannot be represented in JSON Schema");
};
const neverProcessor = (_schema, _ctx, json$1, _params) => {
	json$1.not = {};
};
const anyProcessor = (_schema, _ctx, _json, _params) => {};
const unknownProcessor = (_schema, _ctx, _json, _params) => {};
const dateProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Date cannot be represented in JSON Schema");
};
const enumProcessor = (schema, _ctx, json$1, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.every((v) => typeof v === "number")) json$1.type = "number";
	if (values.every((v) => typeof v === "string")) json$1.type = "string";
	json$1.enum = values;
};
const literalProcessor = (schema, ctx, json$1, _params) => {
	const def = schema._zod.def;
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (ctx.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
	} else if (typeof val === "bigint") if (ctx.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
	else vals.push(Number(val));
	else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json$1.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json$1.enum = [val];
		else json$1.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json$1.type = "number";
		if (vals.every((v) => typeof v === "string")) json$1.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json$1.type = "boolean";
		if (vals.every((v) => v === null)) json$1.type = "null";
		json$1.enum = vals;
	}
};
const nanProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("NaN cannot be represented in JSON Schema");
};
const templateLiteralProcessor = (schema, _ctx, json$1, _params) => {
	const _json = json$1;
	const pattern = schema._zod.pattern;
	if (!pattern) throw new Error("Pattern not found in template literal");
	_json.type = "string";
	_json.pattern = pattern.source;
};
const fileProcessor = (schema, _ctx, json$1, _params) => {
	const _json = json$1;
	const file = {
		type: "string",
		format: "binary",
		contentEncoding: "binary"
	};
	const { minimum, maximum, mime } = schema._zod.bag;
	if (minimum !== void 0) file.minLength = minimum;
	if (maximum !== void 0) file.maxLength = maximum;
	if (mime) if (mime.length === 1) {
		file.contentMediaType = mime[0];
		Object.assign(_json, file);
	} else {
		Object.assign(_json, file);
		_json.anyOf = mime.map((m) => ({ contentMediaType: m }));
	}
	else Object.assign(_json, file);
};
const successProcessor = (_schema, _ctx, json$1, _params) => {
	json$1.type = "boolean";
};
const customProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
};
const functionProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Function types cannot be represented in JSON Schema");
};
const transformProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
};
const mapProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Map cannot be represented in JSON Schema");
};
const setProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Set cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params) => {
	const json$1 = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json$1.minItems = minimum;
	if (typeof maximum === "number") json$1.maxItems = maximum;
	json$1.type = "array";
	json$1.items = process$1(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
const objectProcessor = (schema, ctx, _json, params) => {
	const json$1 = _json;
	const def = schema._zod.def;
	json$1.type = "object";
	json$1.properties = {};
	const shape = def.shape;
	for (const key in shape) json$1.properties[key] = process$1(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	});
	const allKeys = new Set(Object.keys(shape));
	const requiredKeys = new Set([...allKeys].filter((key) => {
		const v = def.shape[key]._zod;
		if (ctx.io === "input") return v.optin === void 0;
		else return v.optout === void 0;
	}));
	if (requiredKeys.size > 0) json$1.required = Array.from(requiredKeys);
	if (def.catchall?._zod.def.type === "never") json$1.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json$1.additionalProperties = false;
	} else if (def.catchall) json$1.additionalProperties = process$1(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
const unionProcessor = (schema, ctx, json$1, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => process$1(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json$1.oneOf = options;
	else json$1.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json$1, params) => {
	const def = schema._zod.def;
	const a = process$1(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = process$1(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	json$1.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
};
const tupleProcessor = (schema, ctx, _json, params) => {
	const json$1 = _json;
	const def = schema._zod.def;
	json$1.type = "array";
	const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
	const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
	const prefixItems = def.items.map((x, i) => process$1(x, ctx, {
		...params,
		path: [
			...params.path,
			prefixPath,
			i
		]
	}));
	const rest = def.rest ? process$1(def.rest, ctx, {
		...params,
		path: [
			...params.path,
			restPath,
			...ctx.target === "openapi-3.0" ? [def.items.length] : []
		]
	}) : null;
	if (ctx.target === "draft-2020-12") {
		json$1.prefixItems = prefixItems;
		if (rest) json$1.items = rest;
	} else if (ctx.target === "openapi-3.0") {
		json$1.items = { anyOf: prefixItems };
		if (rest) json$1.items.anyOf.push(rest);
		json$1.minItems = prefixItems.length;
		if (!rest) json$1.maxItems = prefixItems.length;
	} else {
		json$1.items = prefixItems;
		if (rest) json$1.additionalItems = rest;
	}
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json$1.minItems = minimum;
	if (typeof maximum === "number") json$1.maxItems = maximum;
};
const recordProcessor = (schema, ctx, _json, params) => {
	const json$1 = _json;
	const def = schema._zod.def;
	json$1.type = "object";
	const keyType = def.keyType;
	const patterns = keyType._zod.bag?.patterns;
	if (def.mode === "loose" && patterns && patterns.size > 0) {
		const valueSchema = process$1(def.valueType, ctx, {
			...params,
			path: [
				...params.path,
				"patternProperties",
				"*"
			]
		});
		json$1.patternProperties = {};
		for (const pattern of patterns) json$1.patternProperties[pattern.source] = valueSchema;
	} else {
		if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") json$1.propertyNames = process$1(def.keyType, ctx, {
			...params,
			path: [...params.path, "propertyNames"]
		});
		json$1.additionalProperties = process$1(def.valueType, ctx, {
			...params,
			path: [...params.path, "additionalProperties"]
		});
	}
	const keyValues = keyType._zod.values;
	if (keyValues) {
		const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
		if (validKeyValues.length > 0) json$1.required = validKeyValues;
	}
};
const nullableProcessor = (schema, ctx, json$1, params) => {
	const def = schema._zod.def;
	const inner = process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json$1.nullable = true;
	} else json$1.anyOf = [inner, { type: "null" }];
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
const defaultProcessor = (schema, ctx, json$1, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json$1.default = JSON.parse(JSON.stringify(def.defaultValue));
};
const prefaultProcessor = (schema, ctx, json$1, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io === "input") json$1._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
const catchProcessor = (schema, ctx, json$1, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		throw new Error("Dynamic catch values are not supported in JSON Schema");
	}
	json$1.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const innerType = ctx.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
	process$1(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json$1, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json$1.readOnly = true;
};
const promiseProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
const optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
const lazyProcessor = (schema, ctx, _json, params) => {
	const innerType = schema._zod.innerType;
	process$1(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const allProcessors = {
	string: stringProcessor,
	number: numberProcessor,
	boolean: booleanProcessor,
	bigint: bigintProcessor,
	symbol: symbolProcessor,
	null: nullProcessor,
	undefined: undefinedProcessor,
	void: voidProcessor,
	never: neverProcessor,
	any: anyProcessor,
	unknown: unknownProcessor,
	date: dateProcessor,
	enum: enumProcessor,
	literal: literalProcessor,
	nan: nanProcessor,
	template_literal: templateLiteralProcessor,
	file: fileProcessor,
	success: successProcessor,
	custom: customProcessor,
	function: functionProcessor,
	transform: transformProcessor,
	map: mapProcessor,
	set: setProcessor,
	array: arrayProcessor,
	object: objectProcessor,
	union: unionProcessor,
	intersection: intersectionProcessor,
	tuple: tupleProcessor,
	record: recordProcessor,
	nullable: nullableProcessor,
	nonoptional: nonoptionalProcessor,
	default: defaultProcessor,
	prefault: prefaultProcessor,
	catch: catchProcessor,
	pipe: pipeProcessor,
	readonly: readonlyProcessor,
	promise: promiseProcessor,
	optional: optionalProcessor,
	lazy: lazyProcessor
};
function toJSONSchema(input, params) {
	if ("_idmap" in input) {
		const registry$1 = input;
		const ctx$1 = initializeContext({
			...params,
			processors: allProcessors
		});
		const defs = {};
		for (const entry of registry$1._idmap.entries()) {
			const [_, schema] = entry;
			process$1(schema, ctx$1);
		}
		const schemas = {};
		ctx$1.external = {
			registry: registry$1,
			uri: params?.uri,
			defs
		};
		for (const entry of registry$1._idmap.entries()) {
			const [key, schema] = entry;
			extractDefs(ctx$1, schema);
			schemas[key] = finalize(ctx$1, schema);
		}
		if (Object.keys(defs).length > 0) schemas.__shared = { [ctx$1.target === "draft-2020-12" ? "$defs" : "definitions"]: defs };
		return { schemas };
	}
	const ctx = initializeContext({
		...params,
		processors: allProcessors
	});
	process$1(input, ctx);
	extractDefs(ctx, input);
	return finalize(ctx, input);
}

//#endregion
//#region ../node_modules/zod/v4/classic/iso.js
const ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function datetime(params) {
	return _isoDateTime(ZodISODateTime, params);
}
const ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function date(params) {
	return _isoDate(ZodISODate, params);
}
const ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function time(params) {
	return _isoTime(ZodISOTime, params);
}
const ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function duration(params) {
	return _isoDuration(ZodISODuration, params);
}

//#endregion
//#region ../node_modules/zod/v4/classic/errors.js
const initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	Object.defineProperties(inst, {
		format: { value: (mapper) => formatError(inst, mapper) },
		flatten: { value: (mapper) => flattenError(inst, mapper) },
		addIssue: { value: (issue$1) => {
			inst.issues.push(issue$1);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		addIssues: { value: (issues$1) => {
			inst.issues.push(...issues$1);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		isEmpty: { get() {
			return inst.issues.length === 0;
		} }
	});
};
const ZodError$1 = $constructor("ZodError", initializer);
const ZodRealError = $constructor("ZodError", initializer, { Parent: Error });

//#endregion
//#region ../node_modules/zod/v4/classic/parse.js
const parse = /* @__PURE__ */ _parse$1(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

//#endregion
//#region ../node_modules/zod/v4/classic/schemas.js
const ZodType$1 = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
	$ZodType.init(inst, def);
	Object.assign(inst["~standard"], { jsonSchema: {
		input: createStandardJSONSchemaMethod(inst, "input"),
		output: createStandardJSONSchemaMethod(inst, "output")
	} });
	inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
	inst.def = def;
	inst.type = def.type;
	Object.defineProperty(inst, "_def", { value: def });
	inst.check = (...checks) => {
		return inst.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...checks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	};
	inst.with = inst.check;
	inst.clone = (def$1, params) => clone(inst, def$1, params);
	inst.brand = () => inst;
	inst.register = ((reg, meta$2) => {
		reg.add(inst, meta$2);
		return inst;
	});
	inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
	inst.safeParse = (data, params) => safeParse(inst, data, params);
	inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
	inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
	inst.spa = inst.safeParseAsync;
	inst.encode = (data, params) => encode(inst, data, params);
	inst.decode = (data, params) => decode(inst, data, params);
	inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
	inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
	inst.safeEncode = (data, params) => safeEncode(inst, data, params);
	inst.safeDecode = (data, params) => safeDecode(inst, data, params);
	inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
	inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
	inst.refine = (check, params) => inst.check(refine(check, params));
	inst.superRefine = (refinement) => inst.check(superRefine(refinement));
	inst.overwrite = (fn) => inst.check(_overwrite(fn));
	inst.optional = () => optional(inst);
	inst.exactOptional = () => exactOptional(inst);
	inst.nullable = () => nullable(inst);
	inst.nullish = () => optional(nullable(inst));
	inst.nonoptional = (params) => nonoptional(inst, params);
	inst.array = () => array$1(inst);
	inst.or = (arg) => union([inst, arg]);
	inst.and = (arg) => intersection(inst, arg);
	inst.transform = (tx) => pipe(inst, transform(tx));
	inst.default = (def$1) => _default(inst, def$1);
	inst.prefault = (def$1) => prefault(inst, def$1);
	inst.catch = (params) => _catch(inst, params);
	inst.pipe = (target) => pipe(inst, target);
	inst.readonly = () => readonly(inst);
	inst.describe = (description) => {
		const cl = inst.clone();
		globalRegistry.add(cl, { description });
		return cl;
	};
	Object.defineProperty(inst, "description", {
		get() {
			return globalRegistry.get(inst)?.description;
		},
		configurable: true
	});
	inst.meta = (...args) => {
		if (args.length === 0) return globalRegistry.get(inst);
		const cl = inst.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	};
	inst.isOptional = () => inst.safeParse(void 0).success;
	inst.isNullable = () => inst.safeParse(null).success;
	inst.apply = (fn) => fn(inst);
	return inst;
});
/** @internal */
const _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => stringProcessor(inst, ctx, json$1, params);
	const bag = inst._zod.bag;
	inst.format = bag.format ?? null;
	inst.minLength = bag.minimum ?? null;
	inst.maxLength = bag.maximum ?? null;
	inst.regex = (...args) => inst.check(_regex(...args));
	inst.includes = (...args) => inst.check(_includes(...args));
	inst.startsWith = (...args) => inst.check(_startsWith(...args));
	inst.endsWith = (...args) => inst.check(_endsWith(...args));
	inst.min = (...args) => inst.check(_minLength(...args));
	inst.max = (...args) => inst.check(_maxLength(...args));
	inst.length = (...args) => inst.check(_length(...args));
	inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
	inst.lowercase = (params) => inst.check(_lowercase(params));
	inst.uppercase = (params) => inst.check(_uppercase(params));
	inst.trim = () => inst.check(_trim());
	inst.normalize = (...args) => inst.check(_normalize(...args));
	inst.toLowerCase = () => inst.check(_toLowerCase());
	inst.toUpperCase = () => inst.check(_toUpperCase());
	inst.slugify = () => inst.check(_slugify());
});
const ZodString$1 = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
	inst.email = (params) => inst.check(_email(ZodEmail, params));
	inst.url = (params) => inst.check(_url(ZodURL, params));
	inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
	inst.emoji = (params) => inst.check(_emoji(ZodEmoji, params));
	inst.guid = (params) => inst.check(_guid(ZodGUID, params));
	inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
	inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
	inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
	inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
	inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
	inst.guid = (params) => inst.check(_guid(ZodGUID, params));
	inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
	inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
	inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
	inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
	inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
	inst.xid = (params) => inst.check(_xid(ZodXID, params));
	inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
	inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
	inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
	inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
	inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
	inst.e164 = (params) => inst.check(_e164(ZodE164, params));
	inst.datetime = (params) => inst.check(datetime(params));
	inst.date = (params) => inst.check(date(params));
	inst.time = (params) => inst.check(time(params));
	inst.duration = (params) => inst.check(duration(params));
});
function string(params) {
	return _string(ZodString$1, params);
}
const ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNumber$1 = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => numberProcessor(inst, ctx, json$1, params);
	inst.gt = (value, params) => inst.check(_gt(value, params));
	inst.gte = (value, params) => inst.check(_gte(value, params));
	inst.min = (value, params) => inst.check(_gte(value, params));
	inst.lt = (value, params) => inst.check(_lt(value, params));
	inst.lte = (value, params) => inst.check(_lte(value, params));
	inst.max = (value, params) => inst.check(_lte(value, params));
	inst.int = (params) => inst.check(int(params));
	inst.safe = (params) => inst.check(int(params));
	inst.positive = (params) => inst.check(_gt(0, params));
	inst.nonnegative = (params) => inst.check(_gte(0, params));
	inst.negative = (params) => inst.check(_lt(0, params));
	inst.nonpositive = (params) => inst.check(_lte(0, params));
	inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
	inst.step = (value, params) => inst.check(_multipleOf(value, params));
	inst.finite = () => inst;
	const bag = inst._zod.bag;
	inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
	inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
	inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
	inst.isFinite = true;
	inst.format = bag.format ?? null;
});
function number(params) {
	return _number(ZodNumber$1, params);
}
const ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber$1.init(inst, def);
});
function int(params) {
	return _int(ZodNumberFormat, params);
}
const ZodBoolean$1 = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => booleanProcessor(inst, ctx, json$1, params);
});
function boolean(params) {
	return _boolean(ZodBoolean$1, params);
}
const ZodUndefined$1 = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
	$ZodUndefined.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => undefinedProcessor(inst, ctx, json$1, params);
});
function _undefined(params) {
	return _undefined$1(ZodUndefined$1, params);
}
const ZodNull$1 = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
	$ZodNull.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => nullProcessor(inst, ctx, json$1, params);
});
function _null(params) {
	return _null$1(ZodNull$1, params);
}
const ZodAny$1 = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
	$ZodAny.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => anyProcessor(inst, ctx, json$1, params);
});
function any() {
	return _any(ZodAny$1);
}
const ZodUnknown$1 = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => unknownProcessor(inst, ctx, json$1, params);
});
function unknown() {
	return _unknown(ZodUnknown$1);
}
const ZodNever$1 = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => neverProcessor(inst, ctx, json$1, params);
});
function never(params) {
	return _never(ZodNever$1, params);
}
const ZodArray$1 = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
	$ZodArray.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => arrayProcessor(inst, ctx, json$1, params);
	inst.element = def.element;
	inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
	inst.nonempty = (params) => inst.check(_minLength(1, params));
	inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
	inst.length = (len, params) => inst.check(_length(len, params));
	inst.unwrap = () => inst.element;
});
function array$1(element, params) {
	return _array(ZodArray$1, element, params);
}
const ZodObject$1 = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
	$ZodObjectJIT.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => objectProcessor(inst, ctx, json$1, params);
	defineLazy(inst, "shape", () => {
		return def.shape;
	});
	inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
	inst.catchall = (catchall) => inst.clone({
		...inst._zod.def,
		catchall
	});
	inst.passthrough = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.loose = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.strict = () => inst.clone({
		...inst._zod.def,
		catchall: never()
	});
	inst.strip = () => inst.clone({
		...inst._zod.def,
		catchall: void 0
	});
	inst.extend = (incoming) => {
		return extend(inst, incoming);
	};
	inst.safeExtend = (incoming) => {
		return safeExtend(inst, incoming);
	};
	inst.merge = (other) => merge(inst, other);
	inst.pick = (mask) => pick(inst, mask);
	inst.omit = (mask) => omit(inst, mask);
	inst.partial = (...args) => partial(ZodOptional$1, inst, args[0]);
	inst.required = (...args) => required(ZodNonOptional, inst, args[0]);
});
function object$1(shape, params) {
	return new ZodObject$1({
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	});
}
function strictObject(shape, params) {
	return new ZodObject$1({
		type: "object",
		shape,
		catchall: never(),
		...normalizeParams(params)
	});
}
const ZodUnion$1 = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => unionProcessor(inst, ctx, json$1, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion$1({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodDiscriminatedUnion$1 = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
	ZodUnion$1.init(inst, def);
	$ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
	return new ZodDiscriminatedUnion$1({
		type: "union",
		options,
		discriminator,
		...normalizeParams(params)
	});
}
const ZodIntersection$1 = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => intersectionProcessor(inst, ctx, json$1, params);
});
function intersection(left, right) {
	return new ZodIntersection$1({
		type: "intersection",
		left,
		right
	});
}
const ZodRecord$1 = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
	$ZodRecord.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => recordProcessor(inst, ctx, json$1, params);
	inst.keyType = def.keyType;
	inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
	return new ZodRecord$1({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
const ZodEnum$1 = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => enumProcessor(inst, ctx, json$1, params);
	inst.enum = def.entries;
	inst.options = Object.values(def.entries);
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum$1({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum$1({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	return new ZodEnum$1({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
const ZodLiteral$1 = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => literalProcessor(inst, ctx, json$1, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral$1({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
const ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
	$ZodTransform.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => transformProcessor(inst, ctx, json$1, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output$1) => {
			payload.value = output$1;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional$1 = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => optionalProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional$1({
		type: "optional",
		innerType
	});
}
const ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => optionalProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable$1 = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => nullableProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable$1({
		type: "nullable",
		innerType
	});
}
const ZodDefault$1 = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => defaultProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault$1({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => prefaultProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => nonoptionalProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodCatch$1 = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => catchProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch$1({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
	});
}
const ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => pipeProcessor(inst, ctx, json$1, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodReadonly$1 = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => readonlyProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly$1({
		type: "readonly",
		innerType
	});
}
const ZodLazy$1 = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
	$ZodLazy.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => lazyProcessor(inst, ctx, json$1, params);
	inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
	return new ZodLazy$1({
		type: "lazy",
		getter
	});
}
const ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType$1.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json$1, params) => customProcessor(inst, ctx, json$1, params);
});
function custom(fn, _params) {
	return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
	return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
	return _superRefine(fn);
}
const describe = describe$1;
const meta = meta$1;
function _instanceof(cls, params = {}) {
	const inst = new ZodCustom({
		type: "custom",
		check: "custom",
		fn: (data) => data instanceof cls,
		abort: true,
		...normalizeParams(params)
	});
	inst._zod.bag.Class = cls;
	inst._zod.check = (payload) => {
		if (!(payload.value instanceof cls)) payload.issues.push({
			code: "invalid_type",
			expected: cls.name,
			input: payload.value,
			inst,
			path: [...inst._zod.def.path ?? []]
		});
	};
	return inst;
}

//#endregion
//#region ../node_modules/zod/v3/helpers/util.js
var util;
(function(util$1) {
	util$1.assertEqual = (_) => {};
	function assertIs(_arg) {}
	util$1.assertIs = assertIs;
	function assertNever(_x) {
		throw new Error();
	}
	util$1.assertNever = assertNever;
	util$1.arrayToEnum = (items) => {
		const obj = {};
		for (const item of items) obj[item] = item;
		return obj;
	};
	util$1.getValidEnumValues = (obj) => {
		const validKeys = util$1.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
		const filtered = {};
		for (const k of validKeys) filtered[k] = obj[k];
		return util$1.objectValues(filtered);
	};
	util$1.objectValues = (obj) => {
		return util$1.objectKeys(obj).map(function(e) {
			return obj[e];
		});
	};
	util$1.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object$2) => {
		const keys = [];
		for (const key in object$2) if (Object.prototype.hasOwnProperty.call(object$2, key)) keys.push(key);
		return keys;
	};
	util$1.find = (arr, checker) => {
		for (const item of arr) if (checker(item)) return item;
	};
	util$1.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
	function joinValues(array$2, separator = " | ") {
		return array$2.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
	}
	util$1.joinValues = joinValues;
	util$1.jsonStringifyReplacer = (_, value) => {
		if (typeof value === "bigint") return value.toString();
		return value;
	};
})(util || (util = {}));
var objectUtil;
(function(objectUtil$1) {
	objectUtil$1.mergeShapes = (first, second) => {
		return {
			...first,
			...second
		};
	};
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
	"string",
	"nan",
	"number",
	"integer",
	"float",
	"boolean",
	"date",
	"bigint",
	"symbol",
	"function",
	"undefined",
	"null",
	"array",
	"object",
	"unknown",
	"promise",
	"void",
	"never",
	"map",
	"set"
]);
const getParsedType = (data) => {
	switch (typeof data) {
		case "undefined": return ZodParsedType.undefined;
		case "string": return ZodParsedType.string;
		case "number": return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
		case "boolean": return ZodParsedType.boolean;
		case "function": return ZodParsedType.function;
		case "bigint": return ZodParsedType.bigint;
		case "symbol": return ZodParsedType.symbol;
		case "object":
			if (Array.isArray(data)) return ZodParsedType.array;
			if (data === null) return ZodParsedType.null;
			if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return ZodParsedType.promise;
			if (typeof Map !== "undefined" && data instanceof Map) return ZodParsedType.map;
			if (typeof Set !== "undefined" && data instanceof Set) return ZodParsedType.set;
			if (typeof Date !== "undefined" && data instanceof Date) return ZodParsedType.date;
			return ZodParsedType.object;
		default: return ZodParsedType.unknown;
	}
};

//#endregion
//#region ../node_modules/zod/v3/ZodError.js
const ZodIssueCode = util.arrayToEnum([
	"invalid_type",
	"invalid_literal",
	"custom",
	"invalid_union",
	"invalid_union_discriminator",
	"invalid_enum_value",
	"unrecognized_keys",
	"invalid_arguments",
	"invalid_return_type",
	"invalid_date",
	"invalid_string",
	"too_small",
	"too_big",
	"invalid_intersection_types",
	"not_multiple_of",
	"not_finite"
]);
var ZodError = class ZodError extends Error {
	get errors() {
		return this.issues;
	}
	constructor(issues) {
		super();
		this.issues = [];
		this.addIssue = (sub) => {
			this.issues = [...this.issues, sub];
		};
		this.addIssues = (subs = []) => {
			this.issues = [...this.issues, ...subs];
		};
		const actualProto = new.target.prototype;
		if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
		else this.__proto__ = actualProto;
		this.name = "ZodError";
		this.issues = issues;
	}
	format(_mapper) {
		const mapper = _mapper || function(issue$1) {
			return issue$1.message;
		};
		const fieldErrors = { _errors: [] };
		const processError = (error) => {
			for (const issue$1 of error.issues) if (issue$1.code === "invalid_union") issue$1.unionErrors.map(processError);
			else if (issue$1.code === "invalid_return_type") processError(issue$1.returnTypeError);
			else if (issue$1.code === "invalid_arguments") processError(issue$1.argumentsError);
			else if (issue$1.path.length === 0) fieldErrors._errors.push(mapper(issue$1));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < issue$1.path.length) {
					const el = issue$1.path[i];
					if (!(i === issue$1.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
					else {
						curr[el] = curr[el] || { _errors: [] };
						curr[el]._errors.push(mapper(issue$1));
					}
					curr = curr[el];
					i++;
				}
			}
		};
		processError(this);
		return fieldErrors;
	}
	static assert(value) {
		if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
	}
	toString() {
		return this.message;
	}
	get message() {
		return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
	}
	get isEmpty() {
		return this.issues.length === 0;
	}
	flatten(mapper = (issue$1) => issue$1.message) {
		const fieldErrors = Object.create(null);
		const formErrors = [];
		for (const sub of this.issues) if (sub.path.length > 0) {
			const firstEl = sub.path[0];
			fieldErrors[firstEl] = fieldErrors[firstEl] || [];
			fieldErrors[firstEl].push(mapper(sub));
		} else formErrors.push(mapper(sub));
		return {
			formErrors,
			fieldErrors
		};
	}
	get formErrors() {
		return this.flatten();
	}
};
ZodError.create = (issues) => {
	return new ZodError(issues);
};

//#endregion
//#region ../node_modules/zod/v3/locales/en.js
const errorMap = (issue$1, _ctx) => {
	let message;
	switch (issue$1.code) {
		case ZodIssueCode.invalid_type:
			if (issue$1.received === ZodParsedType.undefined) message = "Required";
			else message = `Expected ${issue$1.expected}, received ${issue$1.received}`;
			break;
		case ZodIssueCode.invalid_literal:
			message = `Invalid literal value, expected ${JSON.stringify(issue$1.expected, util.jsonStringifyReplacer)}`;
			break;
		case ZodIssueCode.unrecognized_keys:
			message = `Unrecognized key(s) in object: ${util.joinValues(issue$1.keys, ", ")}`;
			break;
		case ZodIssueCode.invalid_union:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_union_discriminator:
			message = `Invalid discriminator value. Expected ${util.joinValues(issue$1.options)}`;
			break;
		case ZodIssueCode.invalid_enum_value:
			message = `Invalid enum value. Expected ${util.joinValues(issue$1.options)}, received '${issue$1.received}'`;
			break;
		case ZodIssueCode.invalid_arguments:
			message = `Invalid function arguments`;
			break;
		case ZodIssueCode.invalid_return_type:
			message = `Invalid function return type`;
			break;
		case ZodIssueCode.invalid_date:
			message = `Invalid date`;
			break;
		case ZodIssueCode.invalid_string:
			if (typeof issue$1.validation === "object") if ("includes" in issue$1.validation) {
				message = `Invalid input: must include "${issue$1.validation.includes}"`;
				if (typeof issue$1.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue$1.validation.position}`;
			} else if ("startsWith" in issue$1.validation) message = `Invalid input: must start with "${issue$1.validation.startsWith}"`;
			else if ("endsWith" in issue$1.validation) message = `Invalid input: must end with "${issue$1.validation.endsWith}"`;
			else util.assertNever(issue$1.validation);
			else if (issue$1.validation !== "regex") message = `Invalid ${issue$1.validation}`;
			else message = "Invalid";
			break;
		case ZodIssueCode.too_small:
			if (issue$1.type === "array") message = `Array must contain ${issue$1.exact ? "exactly" : issue$1.inclusive ? `at least` : `more than`} ${issue$1.minimum} element(s)`;
			else if (issue$1.type === "string") message = `String must contain ${issue$1.exact ? "exactly" : issue$1.inclusive ? `at least` : `over`} ${issue$1.minimum} character(s)`;
			else if (issue$1.type === "number") message = `Number must be ${issue$1.exact ? `exactly equal to ` : issue$1.inclusive ? `greater than or equal to ` : `greater than `}${issue$1.minimum}`;
			else if (issue$1.type === "bigint") message = `Number must be ${issue$1.exact ? `exactly equal to ` : issue$1.inclusive ? `greater than or equal to ` : `greater than `}${issue$1.minimum}`;
			else if (issue$1.type === "date") message = `Date must be ${issue$1.exact ? `exactly equal to ` : issue$1.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue$1.minimum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.too_big:
			if (issue$1.type === "array") message = `Array must contain ${issue$1.exact ? `exactly` : issue$1.inclusive ? `at most` : `less than`} ${issue$1.maximum} element(s)`;
			else if (issue$1.type === "string") message = `String must contain ${issue$1.exact ? `exactly` : issue$1.inclusive ? `at most` : `under`} ${issue$1.maximum} character(s)`;
			else if (issue$1.type === "number") message = `Number must be ${issue$1.exact ? `exactly` : issue$1.inclusive ? `less than or equal to` : `less than`} ${issue$1.maximum}`;
			else if (issue$1.type === "bigint") message = `BigInt must be ${issue$1.exact ? `exactly` : issue$1.inclusive ? `less than or equal to` : `less than`} ${issue$1.maximum}`;
			else if (issue$1.type === "date") message = `Date must be ${issue$1.exact ? `exactly` : issue$1.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue$1.maximum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.custom:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_intersection_types:
			message = `Intersection results could not be merged`;
			break;
		case ZodIssueCode.not_multiple_of:
			message = `Number must be a multiple of ${issue$1.multipleOf}`;
			break;
		case ZodIssueCode.not_finite:
			message = "Number must be finite";
			break;
		default:
			message = _ctx.defaultError;
			util.assertNever(issue$1);
	}
	return { message };
};
var en_default = errorMap;

//#endregion
//#region ../node_modules/zod/v3/errors.js
let overrideErrorMap = en_default;
function getErrorMap() {
	return overrideErrorMap;
}

//#endregion
//#region ../node_modules/zod/v3/helpers/parseUtil.js
const makeIssue = (params) => {
	const { data, path, errorMaps, issueData } = params;
	const fullPath = [...path, ...issueData.path || []];
	const fullIssue = {
		...issueData,
		path: fullPath
	};
	if (issueData.message !== void 0) return {
		...issueData,
		path: fullPath,
		message: issueData.message
	};
	let errorMessage = "";
	const maps = errorMaps.filter((m) => !!m).slice().reverse();
	for (const map of maps) errorMessage = map(fullIssue, {
		data,
		defaultError: errorMessage
	}).message;
	return {
		...issueData,
		path: fullPath,
		message: errorMessage
	};
};
function addIssueToContext(ctx, issueData) {
	const overrideMap = getErrorMap();
	const issue$1 = makeIssue({
		issueData,
		data: ctx.data,
		path: ctx.path,
		errorMaps: [
			ctx.common.contextualErrorMap,
			ctx.schemaErrorMap,
			overrideMap,
			overrideMap === en_default ? void 0 : en_default
		].filter((x) => !!x)
	});
	ctx.common.issues.push(issue$1);
}
var ParseStatus = class ParseStatus {
	constructor() {
		this.value = "valid";
	}
	dirty() {
		if (this.value === "valid") this.value = "dirty";
	}
	abort() {
		if (this.value !== "aborted") this.value = "aborted";
	}
	static mergeArray(status, results) {
		const arrayValue = [];
		for (const s of results) {
			if (s.status === "aborted") return INVALID;
			if (s.status === "dirty") status.dirty();
			arrayValue.push(s.value);
		}
		return {
			status: status.value,
			value: arrayValue
		};
	}
	static async mergeObjectAsync(status, pairs) {
		const syncPairs = [];
		for (const pair of pairs) {
			const key = await pair.key;
			const value = await pair.value;
			syncPairs.push({
				key,
				value
			});
		}
		return ParseStatus.mergeObjectSync(status, syncPairs);
	}
	static mergeObjectSync(status, pairs) {
		const finalObject = {};
		for (const pair of pairs) {
			const { key, value } = pair;
			if (key.status === "aborted") return INVALID;
			if (value.status === "aborted") return INVALID;
			if (key.status === "dirty") status.dirty();
			if (value.status === "dirty") status.dirty();
			if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
		}
		return {
			status: status.value,
			value: finalObject
		};
	}
};
const INVALID = Object.freeze({ status: "aborted" });
const DIRTY = (value) => ({
	status: "dirty",
	value
});
const OK = (value) => ({
	status: "valid",
	value
});
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

//#endregion
//#region ../node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil$1) {
	errorUtil$1.errToObj = (message) => typeof message === "string" ? { message } : message || {};
	errorUtil$1.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

//#endregion
//#region ../node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
	constructor(parent, value, path, key) {
		this._cachedPath = [];
		this.parent = parent;
		this.data = value;
		this._path = path;
		this._key = key;
	}
	get path() {
		if (!this._cachedPath.length) if (Array.isArray(this._key)) this._cachedPath.push(...this._path, ...this._key);
		else this._cachedPath.push(...this._path, this._key);
		return this._cachedPath;
	}
};
const handleResult = (ctx, result) => {
	if (isValid(result)) return {
		success: true,
		data: result.value
	};
	else {
		if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
		return {
			success: false,
			get error() {
				if (this._error) return this._error;
				this._error = new ZodError(ctx.common.issues);
				return this._error;
			}
		};
	}
};
function processCreateParams(params) {
	if (!params) return {};
	const { errorMap: errorMap$1, invalid_type_error, required_error, description } = params;
	if (errorMap$1 && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
	if (errorMap$1) return {
		errorMap: errorMap$1,
		description
	};
	const customMap = (iss, ctx) => {
		const { message } = params;
		if (iss.code === "invalid_enum_value") return { message: message ?? ctx.defaultError };
		if (typeof ctx.data === "undefined") return { message: message ?? required_error ?? ctx.defaultError };
		if (iss.code !== "invalid_type") return { message: ctx.defaultError };
		return { message: message ?? invalid_type_error ?? ctx.defaultError };
	};
	return {
		errorMap: customMap,
		description
	};
}
var ZodType = class {
	get description() {
		return this._def.description;
	}
	_getType(input) {
		return getParsedType(input.data);
	}
	_getOrReturnCtx(input, ctx) {
		return ctx || {
			common: input.parent.common,
			data: input.data,
			parsedType: getParsedType(input.data),
			schemaErrorMap: this._def.errorMap,
			path: input.path,
			parent: input.parent
		};
	}
	_processInputParams(input) {
		return {
			status: new ParseStatus(),
			ctx: {
				common: input.parent.common,
				data: input.data,
				parsedType: getParsedType(input.data),
				schemaErrorMap: this._def.errorMap,
				path: input.path,
				parent: input.parent
			}
		};
	}
	_parseSync(input) {
		const result = this._parse(input);
		if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
		return result;
	}
	_parseAsync(input) {
		const result = this._parse(input);
		return Promise.resolve(result);
	}
	parse(data, params) {
		const result = this.safeParse(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	safeParse(data, params) {
		const ctx = {
			common: {
				issues: [],
				async: params?.async ?? false,
				contextualErrorMap: params?.errorMap
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		return handleResult(ctx, this._parseSync({
			data,
			path: ctx.path,
			parent: ctx
		}));
	}
	"~validate"(data) {
		const ctx = {
			common: {
				issues: [],
				async: !!this["~standard"].async
			},
			path: [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		if (!this["~standard"].async) try {
			const result = this._parseSync({
				data,
				path: [],
				parent: ctx
			});
			return isValid(result) ? { value: result.value } : { issues: ctx.common.issues };
		} catch (err) {
			if (err?.message?.toLowerCase()?.includes("encountered")) this["~standard"].async = true;
			ctx.common = {
				issues: [],
				async: true
			};
		}
		return this._parseAsync({
			data,
			path: [],
			parent: ctx
		}).then((result) => isValid(result) ? { value: result.value } : { issues: ctx.common.issues });
	}
	async parseAsync(data, params) {
		const result = await this.safeParseAsync(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	async safeParseAsync(data, params) {
		const ctx = {
			common: {
				issues: [],
				contextualErrorMap: params?.errorMap,
				async: true
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		const maybeAsyncResult = this._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
		return handleResult(ctx, await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult)));
	}
	refine(check, message) {
		const getIssueProperties = (val) => {
			if (typeof message === "string" || typeof message === "undefined") return { message };
			else if (typeof message === "function") return message(val);
			else return message;
		};
		return this._refinement((val, ctx) => {
			const result = check(val);
			const setError = () => ctx.addIssue({
				code: ZodIssueCode.custom,
				...getIssueProperties(val)
			});
			if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
				if (!data) {
					setError();
					return false;
				} else return true;
			});
			if (!result) {
				setError();
				return false;
			} else return true;
		});
	}
	refinement(check, refinementData) {
		return this._refinement((val, ctx) => {
			if (!check(val)) {
				ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
				return false;
			} else return true;
		});
	}
	_refinement(refinement) {
		return new ZodEffects({
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "refinement",
				refinement
			}
		});
	}
	superRefine(refinement) {
		return this._refinement(refinement);
	}
	constructor(def) {
		/** Alias of safeParseAsync */
		this.spa = this.safeParseAsync;
		this._def = def;
		this.parse = this.parse.bind(this);
		this.safeParse = this.safeParse.bind(this);
		this.parseAsync = this.parseAsync.bind(this);
		this.safeParseAsync = this.safeParseAsync.bind(this);
		this.spa = this.spa.bind(this);
		this.refine = this.refine.bind(this);
		this.refinement = this.refinement.bind(this);
		this.superRefine = this.superRefine.bind(this);
		this.optional = this.optional.bind(this);
		this.nullable = this.nullable.bind(this);
		this.nullish = this.nullish.bind(this);
		this.array = this.array.bind(this);
		this.promise = this.promise.bind(this);
		this.or = this.or.bind(this);
		this.and = this.and.bind(this);
		this.transform = this.transform.bind(this);
		this.brand = this.brand.bind(this);
		this.default = this.default.bind(this);
		this.catch = this.catch.bind(this);
		this.describe = this.describe.bind(this);
		this.pipe = this.pipe.bind(this);
		this.readonly = this.readonly.bind(this);
		this.isNullable = this.isNullable.bind(this);
		this.isOptional = this.isOptional.bind(this);
		this["~standard"] = {
			version: 1,
			vendor: "zod",
			validate: (data) => this["~validate"](data)
		};
	}
	optional() {
		return ZodOptional.create(this, this._def);
	}
	nullable() {
		return ZodNullable.create(this, this._def);
	}
	nullish() {
		return this.nullable().optional();
	}
	array() {
		return ZodArray.create(this);
	}
	promise() {
		return ZodPromise.create(this, this._def);
	}
	or(option) {
		return ZodUnion.create([this, option], this._def);
	}
	and(incoming) {
		return ZodIntersection.create(this, incoming, this._def);
	}
	transform(transform$1) {
		return new ZodEffects({
			...processCreateParams(this._def),
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "transform",
				transform: transform$1
			}
		});
	}
	default(def) {
		const defaultValueFunc = typeof def === "function" ? def : () => def;
		return new ZodDefault({
			...processCreateParams(this._def),
			innerType: this,
			defaultValue: defaultValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodDefault
		});
	}
	brand() {
		return new ZodBranded({
			typeName: ZodFirstPartyTypeKind.ZodBranded,
			type: this,
			...processCreateParams(this._def)
		});
	}
	catch(def) {
		const catchValueFunc = typeof def === "function" ? def : () => def;
		return new ZodCatch({
			...processCreateParams(this._def),
			innerType: this,
			catchValue: catchValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodCatch
		});
	}
	describe(description) {
		const This = this.constructor;
		return new This({
			...this._def,
			description
		});
	}
	pipe(target) {
		return ZodPipeline.create(this, target);
	}
	readonly() {
		return ZodReadonly.create(this);
	}
	isOptional() {
		return this.safeParse(void 0).success;
	}
	isNullable() {
		return this.safeParse(null).success;
	}
};
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex$1;
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = /* @__PURE__ */ new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
	let secondsRegexSource = `[0-5]\\d`;
	if (args.precision) secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
	else if (args.precision == null) secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
	const secondsQuantifier = args.precision ? "+" : "?";
	return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
	return /* @__PURE__ */ new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
	let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
	const opts = [];
	opts.push(args.local ? `Z?` : `Z`);
	if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
	regex = `${regex}(${opts.join("|")})`;
	return /* @__PURE__ */ new RegExp(`^${regex}$`);
}
function isValidIP(ip, version$1) {
	if ((version$1 === "v4" || !version$1) && ipv4Regex.test(ip)) return true;
	if ((version$1 === "v6" || !version$1) && ipv6Regex.test(ip)) return true;
	return false;
}
function isValidJWT(jwt, alg) {
	if (!jwtRegex.test(jwt)) return false;
	try {
		const [header] = jwt.split(".");
		if (!header) return false;
		const base64$1 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
		const decoded = JSON.parse(atob(base64$1));
		if (typeof decoded !== "object" || decoded === null) return false;
		if ("typ" in decoded && decoded?.typ !== "JWT") return false;
		if (!decoded.alg) return false;
		if (alg && decoded.alg !== alg) return false;
		return true;
	} catch {
		return false;
	}
}
function isValidCidr(ip, version$1) {
	if ((version$1 === "v4" || !version$1) && ipv4CidrRegex.test(ip)) return true;
	if ((version$1 === "v6" || !version$1) && ipv6CidrRegex.test(ip)) return true;
	return false;
}
var ZodString = class ZodString extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = String(input.data);
		if (this._getType(input) !== ZodParsedType.string) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.string,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.length < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.length > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "length") {
			const tooBig = input.data.length > check.value;
			const tooSmall = input.data.length < check.value;
			if (tooBig || tooSmall) {
				ctx = this._getOrReturnCtx(input, ctx);
				if (tooBig) addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				else if (tooSmall) addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "email") {
			if (!emailRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "email",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "emoji") {
			if (!emojiRegex$1) emojiRegex$1 = new RegExp(_emojiRegex, "u");
			if (!emojiRegex$1.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "emoji",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "uuid") {
			if (!uuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "uuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "nanoid") {
			if (!nanoidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "nanoid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid") {
			if (!cuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid2") {
			if (!cuid2Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid2",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ulid") {
			if (!ulidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ulid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "url") try {
			new URL(input.data);
		} catch {
			ctx = this._getOrReturnCtx(input, ctx);
			addIssueToContext(ctx, {
				validation: "url",
				code: ZodIssueCode.invalid_string,
				message: check.message
			});
			status.dirty();
		}
		else if (check.kind === "regex") {
			check.regex.lastIndex = 0;
			if (!check.regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "regex",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "trim") input.data = input.data.trim();
		else if (check.kind === "includes") {
			if (!input.data.includes(check.value, check.position)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: {
						includes: check.value,
						position: check.position
					},
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
		else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
		else if (check.kind === "startsWith") {
			if (!input.data.startsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { startsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "endsWith") {
			if (!input.data.endsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { endsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "datetime") {
			if (!datetimeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "datetime",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "date") {
			if (!dateRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "date",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "time") {
			if (!timeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "time",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "duration") {
			if (!durationRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "duration",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ip") {
			if (!isValidIP(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ip",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "jwt") {
			if (!isValidJWT(input.data, check.alg)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "jwt",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cidr") {
			if (!isValidCidr(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cidr",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64") {
			if (!base64Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64url") {
			if (!base64urlRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64url",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_regex(regex, validation, message) {
		return this.refinement((data) => regex.test(data), {
			validation,
			code: ZodIssueCode.invalid_string,
			...errorUtil.errToObj(message)
		});
	}
	_addCheck(check) {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	email(message) {
		return this._addCheck({
			kind: "email",
			...errorUtil.errToObj(message)
		});
	}
	url(message) {
		return this._addCheck({
			kind: "url",
			...errorUtil.errToObj(message)
		});
	}
	emoji(message) {
		return this._addCheck({
			kind: "emoji",
			...errorUtil.errToObj(message)
		});
	}
	uuid(message) {
		return this._addCheck({
			kind: "uuid",
			...errorUtil.errToObj(message)
		});
	}
	nanoid(message) {
		return this._addCheck({
			kind: "nanoid",
			...errorUtil.errToObj(message)
		});
	}
	cuid(message) {
		return this._addCheck({
			kind: "cuid",
			...errorUtil.errToObj(message)
		});
	}
	cuid2(message) {
		return this._addCheck({
			kind: "cuid2",
			...errorUtil.errToObj(message)
		});
	}
	ulid(message) {
		return this._addCheck({
			kind: "ulid",
			...errorUtil.errToObj(message)
		});
	}
	base64(message) {
		return this._addCheck({
			kind: "base64",
			...errorUtil.errToObj(message)
		});
	}
	base64url(message) {
		return this._addCheck({
			kind: "base64url",
			...errorUtil.errToObj(message)
		});
	}
	jwt(options) {
		return this._addCheck({
			kind: "jwt",
			...errorUtil.errToObj(options)
		});
	}
	ip(options) {
		return this._addCheck({
			kind: "ip",
			...errorUtil.errToObj(options)
		});
	}
	cidr(options) {
		return this._addCheck({
			kind: "cidr",
			...errorUtil.errToObj(options)
		});
	}
	datetime(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "datetime",
			precision: null,
			offset: false,
			local: false,
			message: options
		});
		return this._addCheck({
			kind: "datetime",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			offset: options?.offset ?? false,
			local: options?.local ?? false,
			...errorUtil.errToObj(options?.message)
		});
	}
	date(message) {
		return this._addCheck({
			kind: "date",
			message
		});
	}
	time(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "time",
			precision: null,
			message: options
		});
		return this._addCheck({
			kind: "time",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			...errorUtil.errToObj(options?.message)
		});
	}
	duration(message) {
		return this._addCheck({
			kind: "duration",
			...errorUtil.errToObj(message)
		});
	}
	regex(regex, message) {
		return this._addCheck({
			kind: "regex",
			regex,
			...errorUtil.errToObj(message)
		});
	}
	includes(value, options) {
		return this._addCheck({
			kind: "includes",
			value,
			position: options?.position,
			...errorUtil.errToObj(options?.message)
		});
	}
	startsWith(value, message) {
		return this._addCheck({
			kind: "startsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	endsWith(value, message) {
		return this._addCheck({
			kind: "endsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	min(minLength, message) {
		return this._addCheck({
			kind: "min",
			value: minLength,
			...errorUtil.errToObj(message)
		});
	}
	max(maxLength, message) {
		return this._addCheck({
			kind: "max",
			value: maxLength,
			...errorUtil.errToObj(message)
		});
	}
	length(len, message) {
		return this._addCheck({
			kind: "length",
			value: len,
			...errorUtil.errToObj(message)
		});
	}
	/**
	* Equivalent to `.min(1)`
	*/
	nonempty(message) {
		return this.min(1, errorUtil.errToObj(message));
	}
	trim() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "trim" }]
		});
	}
	toLowerCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toLowerCase" }]
		});
	}
	toUpperCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toUpperCase" }]
		});
	}
	get isDatetime() {
		return !!this._def.checks.find((ch) => ch.kind === "datetime");
	}
	get isDate() {
		return !!this._def.checks.find((ch) => ch.kind === "date");
	}
	get isTime() {
		return !!this._def.checks.find((ch) => ch.kind === "time");
	}
	get isDuration() {
		return !!this._def.checks.find((ch) => ch.kind === "duration");
	}
	get isEmail() {
		return !!this._def.checks.find((ch) => ch.kind === "email");
	}
	get isURL() {
		return !!this._def.checks.find((ch) => ch.kind === "url");
	}
	get isEmoji() {
		return !!this._def.checks.find((ch) => ch.kind === "emoji");
	}
	get isUUID() {
		return !!this._def.checks.find((ch) => ch.kind === "uuid");
	}
	get isNANOID() {
		return !!this._def.checks.find((ch) => ch.kind === "nanoid");
	}
	get isCUID() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid");
	}
	get isCUID2() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid2");
	}
	get isULID() {
		return !!this._def.checks.find((ch) => ch.kind === "ulid");
	}
	get isIP() {
		return !!this._def.checks.find((ch) => ch.kind === "ip");
	}
	get isCIDR() {
		return !!this._def.checks.find((ch) => ch.kind === "cidr");
	}
	get isBase64() {
		return !!this._def.checks.find((ch) => ch.kind === "base64");
	}
	get isBase64url() {
		return !!this._def.checks.find((ch) => ch.kind === "base64url");
	}
	get minLength() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxLength() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodString.create = (params) => {
	return new ZodString({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodString,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepDecCount = (step.toString().split(".")[1] || "").length;
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
var ZodNumber = class ZodNumber extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
		this.step = this.multipleOf;
	}
	_parse(input) {
		if (this._def.coerce) input.data = Number(input.data);
		if (this._getType(input) !== ZodParsedType.number) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.number,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "int") {
			if (!util.isInteger(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_type,
					expected: "integer",
					received: "float",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (floatSafeRemainder(input.data, check.value) !== 0) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "finite") {
			if (!Number.isFinite(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_finite,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	int(message) {
		return this._addCheck({
			kind: "int",
			message: errorUtil.toString(message)
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	finite(message) {
		return this._addCheck({
			kind: "finite",
			message: errorUtil.toString(message)
		});
	}
	safe(message) {
		return this._addCheck({
			kind: "min",
			inclusive: true,
			value: Number.MIN_SAFE_INTEGER,
			message: errorUtil.toString(message)
		})._addCheck({
			kind: "max",
			inclusive: true,
			value: Number.MAX_SAFE_INTEGER,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
	get isInt() {
		return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
	}
	get isFinite() {
		let max = null;
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
		else if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		} else if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return Number.isFinite(min) && Number.isFinite(max);
	}
};
ZodNumber.create = (params) => {
	return new ZodNumber({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodNumber,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodBigInt = class ZodBigInt extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
	}
	_parse(input) {
		if (this._def.coerce) try {
			input.data = BigInt(input.data);
		} catch {
			return this._getInvalidInput(input);
		}
		if (this._getType(input) !== ZodParsedType.bigint) return this._getInvalidInput(input);
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					type: "bigint",
					minimum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					type: "bigint",
					maximum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (input.data % check.value !== BigInt(0)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_getInvalidInput(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.bigint,
			received: ctx.parsedType
		});
		return INVALID;
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodBigInt.create = (params) => {
	return new ZodBigInt({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodBigInt,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
var ZodBoolean = class extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = Boolean(input.data);
		if (this._getType(input) !== ZodParsedType.boolean) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.boolean,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodBoolean.create = (params) => {
	return new ZodBoolean({
		typeName: ZodFirstPartyTypeKind.ZodBoolean,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodDate = class ZodDate extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = new Date(input.data);
		if (this._getType(input) !== ZodParsedType.date) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.date,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		if (Number.isNaN(input.data.getTime())) {
			addIssueToContext(this._getOrReturnCtx(input), { code: ZodIssueCode.invalid_date });
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.getTime() < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					message: check.message,
					inclusive: true,
					exact: false,
					minimum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.getTime() > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					message: check.message,
					inclusive: true,
					exact: false,
					maximum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: new Date(input.data.getTime())
		};
	}
	_addCheck(check) {
		return new ZodDate({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	min(minDate, message) {
		return this._addCheck({
			kind: "min",
			value: minDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	max(maxDate, message) {
		return this._addCheck({
			kind: "max",
			value: maxDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	get minDate() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min != null ? new Date(min) : null;
	}
	get maxDate() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max != null ? new Date(max) : null;
	}
};
ZodDate.create = (params) => {
	return new ZodDate({
		checks: [],
		coerce: params?.coerce || false,
		typeName: ZodFirstPartyTypeKind.ZodDate,
		...processCreateParams(params)
	});
};
var ZodSymbol = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.symbol) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.symbol,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodSymbol.create = (params) => {
	return new ZodSymbol({
		typeName: ZodFirstPartyTypeKind.ZodSymbol,
		...processCreateParams(params)
	});
};
var ZodUndefined = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.undefined,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodUndefined.create = (params) => {
	return new ZodUndefined({
		typeName: ZodFirstPartyTypeKind.ZodUndefined,
		...processCreateParams(params)
	});
};
var ZodNull = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.null) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.null,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodNull.create = (params) => {
	return new ZodNull({
		typeName: ZodFirstPartyTypeKind.ZodNull,
		...processCreateParams(params)
	});
};
var ZodAny = class extends ZodType {
	constructor() {
		super(...arguments);
		this._any = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodAny.create = (params) => {
	return new ZodAny({
		typeName: ZodFirstPartyTypeKind.ZodAny,
		...processCreateParams(params)
	});
};
var ZodUnknown = class extends ZodType {
	constructor() {
		super(...arguments);
		this._unknown = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodUnknown.create = (params) => {
	return new ZodUnknown({
		typeName: ZodFirstPartyTypeKind.ZodUnknown,
		...processCreateParams(params)
	});
};
var ZodNever = class extends ZodType {
	_parse(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.never,
			received: ctx.parsedType
		});
		return INVALID;
	}
};
ZodNever.create = (params) => {
	return new ZodNever({
		typeName: ZodFirstPartyTypeKind.ZodNever,
		...processCreateParams(params)
	});
};
var ZodVoid = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.void,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodVoid.create = (params) => {
	return new ZodVoid({
		typeName: ZodFirstPartyTypeKind.ZodVoid,
		...processCreateParams(params)
	});
};
var ZodArray = class ZodArray extends ZodType {
	_parse(input) {
		const { ctx, status } = this._processInputParams(input);
		const def = this._def;
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (def.exactLength !== null) {
			const tooBig = ctx.data.length > def.exactLength.value;
			const tooSmall = ctx.data.length < def.exactLength.value;
			if (tooBig || tooSmall) {
				addIssueToContext(ctx, {
					code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
					minimum: tooSmall ? def.exactLength.value : void 0,
					maximum: tooBig ? def.exactLength.value : void 0,
					type: "array",
					inclusive: true,
					exact: true,
					message: def.exactLength.message
				});
				status.dirty();
			}
		}
		if (def.minLength !== null) {
			if (ctx.data.length < def.minLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.minLength.message
				});
				status.dirty();
			}
		}
		if (def.maxLength !== null) {
			if (ctx.data.length > def.maxLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.maxLength.message
				});
				status.dirty();
			}
		}
		if (ctx.common.async) return Promise.all([...ctx.data].map((item, i) => {
			return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		})).then((result$1) => {
			return ParseStatus.mergeArray(status, result$1);
		});
		const result = [...ctx.data].map((item, i) => {
			return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		});
		return ParseStatus.mergeArray(status, result);
	}
	get element() {
		return this._def.type;
	}
	min(minLength, message) {
		return new ZodArray({
			...this._def,
			minLength: {
				value: minLength,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxLength, message) {
		return new ZodArray({
			...this._def,
			maxLength: {
				value: maxLength,
				message: errorUtil.toString(message)
			}
		});
	}
	length(len, message) {
		return new ZodArray({
			...this._def,
			exactLength: {
				value: len,
				message: errorUtil.toString(message)
			}
		});
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodArray.create = (schema, params) => {
	return new ZodArray({
		type: schema,
		minLength: null,
		maxLength: null,
		exactLength: null,
		typeName: ZodFirstPartyTypeKind.ZodArray,
		...processCreateParams(params)
	});
};
function deepPartialify(schema) {
	if (schema instanceof ZodObject) {
		const newShape = {};
		for (const key in schema.shape) {
			const fieldSchema = schema.shape[key];
			newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
		}
		return new ZodObject({
			...schema._def,
			shape: () => newShape
		});
	} else if (schema instanceof ZodArray) return new ZodArray({
		...schema._def,
		type: deepPartialify(schema.element)
	});
	else if (schema instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema.unwrap()));
	else if (schema instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema.unwrap()));
	else if (schema instanceof ZodTuple) return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
	else return schema;
}
var ZodObject = class ZodObject extends ZodType {
	constructor() {
		super(...arguments);
		this._cached = null;
		/**
		* @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
		* If you want to pass through unknown properties, use `.passthrough()` instead.
		*/
		this.nonstrict = this.passthrough;
		/**
		* @deprecated Use `.extend` instead
		*  */
		this.augment = this.extend;
	}
	_getCached() {
		if (this._cached !== null) return this._cached;
		const shape = this._def.shape();
		this._cached = {
			shape,
			keys: util.objectKeys(shape)
		};
		return this._cached;
	}
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.object) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		const { status, ctx } = this._processInputParams(input);
		const { shape, keys: shapeKeys } = this._getCached();
		const extraKeys = [];
		if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
			for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
		}
		const pairs = [];
		for (const key of shapeKeys) {
			const keyValidator = shape[key];
			const value = ctx.data[key];
			pairs.push({
				key: {
					status: "valid",
					value: key
				},
				value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
				alwaysSet: key in ctx.data
			});
		}
		if (this._def.catchall instanceof ZodNever) {
			const unknownKeys = this._def.unknownKeys;
			if (unknownKeys === "passthrough") for (const key of extraKeys) pairs.push({
				key: {
					status: "valid",
					value: key
				},
				value: {
					status: "valid",
					value: ctx.data[key]
				}
			});
			else if (unknownKeys === "strict") {
				if (extraKeys.length > 0) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.unrecognized_keys,
						keys: extraKeys
					});
					status.dirty();
				}
			} else if (unknownKeys === "strip") {} else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
		} else {
			const catchall = this._def.catchall;
			for (const key of extraKeys) {
				const value = ctx.data[key];
				pairs.push({
					key: {
						status: "valid",
						value: key
					},
					value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
					alwaysSet: key in ctx.data
				});
			}
		}
		if (ctx.common.async) return Promise.resolve().then(async () => {
			const syncPairs = [];
			for (const pair of pairs) {
				const key = await pair.key;
				const value = await pair.value;
				syncPairs.push({
					key,
					value,
					alwaysSet: pair.alwaysSet
				});
			}
			return syncPairs;
		}).then((syncPairs) => {
			return ParseStatus.mergeObjectSync(status, syncPairs);
		});
		else return ParseStatus.mergeObjectSync(status, pairs);
	}
	get shape() {
		return this._def.shape();
	}
	strict(message) {
		errorUtil.errToObj;
		return new ZodObject({
			...this._def,
			unknownKeys: "strict",
			...message !== void 0 ? { errorMap: (issue$1, ctx) => {
				const defaultError = this._def.errorMap?.(issue$1, ctx).message ?? ctx.defaultError;
				if (issue$1.code === "unrecognized_keys") return { message: errorUtil.errToObj(message).message ?? defaultError };
				return { message: defaultError };
			} } : {}
		});
	}
	strip() {
		return new ZodObject({
			...this._def,
			unknownKeys: "strip"
		});
	}
	passthrough() {
		return new ZodObject({
			...this._def,
			unknownKeys: "passthrough"
		});
	}
	extend(augmentation) {
		return new ZodObject({
			...this._def,
			shape: () => ({
				...this._def.shape(),
				...augmentation
			})
		});
	}
	/**
	* Prior to zod@1.0.12 there was a bug in the
	* inferred type of merged objects. Please
	* upgrade if you are experiencing issues.
	*/
	merge(merging) {
		return new ZodObject({
			unknownKeys: merging._def.unknownKeys,
			catchall: merging._def.catchall,
			shape: () => ({
				...this._def.shape(),
				...merging._def.shape()
			}),
			typeName: ZodFirstPartyTypeKind.ZodObject
		});
	}
	setKey(key, schema) {
		return this.augment({ [key]: schema });
	}
	catchall(index) {
		return new ZodObject({
			...this._def,
			catchall: index
		});
	}
	pick(mask) {
		const shape = {};
		for (const key of util.objectKeys(mask)) if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	omit(mask) {
		const shape = {};
		for (const key of util.objectKeys(this.shape)) if (!mask[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	/**
	* @deprecated
	*/
	deepPartial() {
		return deepPartialify(this);
	}
	partial(mask) {
		const newShape = {};
		for (const key of util.objectKeys(this.shape)) {
			const fieldSchema = this.shape[key];
			if (mask && !mask[key]) newShape[key] = fieldSchema;
			else newShape[key] = fieldSchema.optional();
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	required(mask) {
		const newShape = {};
		for (const key of util.objectKeys(this.shape)) if (mask && !mask[key]) newShape[key] = this.shape[key];
		else {
			let newField = this.shape[key];
			while (newField instanceof ZodOptional) newField = newField._def.innerType;
			newShape[key] = newField;
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	keyof() {
		return createZodEnum(util.objectKeys(this.shape));
	}
};
ZodObject.create = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.strictCreate = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strict",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.lazycreate = (shape, params) => {
	return new ZodObject({
		shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
var ZodUnion = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const options = this._def.options;
		function handleResults(results) {
			for (const result of results) if (result.result.status === "valid") return result.result;
			for (const result of results) if (result.result.status === "dirty") {
				ctx.common.issues.push(...result.ctx.common.issues);
				return result.result;
			}
			const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
		if (ctx.common.async) return Promise.all(options.map(async (option) => {
			const childCtx = {
				...ctx,
				common: {
					...ctx.common,
					issues: []
				},
				parent: null
			};
			return {
				result: await option._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				}),
				ctx: childCtx
			};
		})).then(handleResults);
		else {
			let dirty = void 0;
			const issues = [];
			for (const option of options) {
				const childCtx = {
					...ctx,
					common: {
						...ctx.common,
						issues: []
					},
					parent: null
				};
				const result = option._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				});
				if (result.status === "valid") return result;
				else if (result.status === "dirty" && !dirty) dirty = {
					result,
					ctx: childCtx
				};
				if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
			}
			if (dirty) {
				ctx.common.issues.push(...dirty.ctx.common.issues);
				return dirty.result;
			}
			const unionErrors = issues.map((issues$1) => new ZodError(issues$1));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
	}
	get options() {
		return this._def.options;
	}
};
ZodUnion.create = (types, params) => {
	return new ZodUnion({
		options: types,
		typeName: ZodFirstPartyTypeKind.ZodUnion,
		...processCreateParams(params)
	});
};
const getDiscriminator = (type) => {
	if (type instanceof ZodLazy) return getDiscriminator(type.schema);
	else if (type instanceof ZodEffects) return getDiscriminator(type.innerType());
	else if (type instanceof ZodLiteral) return [type.value];
	else if (type instanceof ZodEnum) return type.options;
	else if (type instanceof ZodNativeEnum) return util.objectValues(type.enum);
	else if (type instanceof ZodDefault) return getDiscriminator(type._def.innerType);
	else if (type instanceof ZodUndefined) return [void 0];
	else if (type instanceof ZodNull) return [null];
	else if (type instanceof ZodOptional) return [void 0, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodNullable) return [null, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodBranded) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodReadonly) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodCatch) return getDiscriminator(type._def.innerType);
	else return [];
};
var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const discriminator = this.discriminator;
		const discriminatorValue = ctx.data[discriminator];
		const option = this.optionsMap.get(discriminatorValue);
		if (!option) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union_discriminator,
				options: Array.from(this.optionsMap.keys()),
				path: [discriminator]
			});
			return INVALID;
		}
		if (ctx.common.async) return option._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
		else return option._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
	get discriminator() {
		return this._def.discriminator;
	}
	get options() {
		return this._def.options;
	}
	get optionsMap() {
		return this._def.optionsMap;
	}
	/**
	* The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
	* However, it only allows a union of objects, all of which need to share a discriminator property. This property must
	* have a different value for each object in the union.
	* @param discriminator the name of the discriminator property
	* @param types an array of object schemas
	* @param params
	*/
	static create(discriminator, options, params) {
		const optionsMap = /* @__PURE__ */ new Map();
		for (const type of options) {
			const discriminatorValues = getDiscriminator(type.shape[discriminator]);
			if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
			for (const value of discriminatorValues) {
				if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
				optionsMap.set(value, type);
			}
		}
		return new ZodDiscriminatedUnion({
			typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
			discriminator,
			options,
			optionsMap,
			...processCreateParams(params)
		});
	}
};
function mergeValues(a, b) {
	const aType = getParsedType(a);
	const bType = getParsedType(b);
	if (a === b) return {
		valid: true,
		data: a
	};
	else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
		const bKeys = util.objectKeys(b);
		const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return { valid: false };
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	} else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
		if (a.length !== b.length) return { valid: false };
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return { valid: false };
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	} else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) return {
		valid: true,
		data: a
	};
	else return { valid: false };
}
var ZodIntersection = class extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const handleParsed = (parsedLeft, parsedRight) => {
			if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
			const merged = mergeValues(parsedLeft.value, parsedRight.value);
			if (!merged.valid) {
				addIssueToContext(ctx, { code: ZodIssueCode.invalid_intersection_types });
				return INVALID;
			}
			if (isDirty(parsedLeft) || isDirty(parsedRight)) status.dirty();
			return {
				status: status.value,
				value: merged.data
			};
		};
		if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		})]).then(([left, right]) => handleParsed(left, right));
		else return handleParsed(this._def.left._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}));
	}
};
ZodIntersection.create = (left, right, params) => {
	return new ZodIntersection({
		left,
		right,
		typeName: ZodFirstPartyTypeKind.ZodIntersection,
		...processCreateParams(params)
	});
};
var ZodTuple = class ZodTuple extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (ctx.data.length < this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_small,
				minimum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			return INVALID;
		}
		if (!this._def.rest && ctx.data.length > this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_big,
				maximum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			status.dirty();
		}
		const items = [...ctx.data].map((item, itemIndex) => {
			const schema = this._def.items[itemIndex] || this._def.rest;
			if (!schema) return null;
			return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
		}).filter((x) => !!x);
		if (ctx.common.async) return Promise.all(items).then((results) => {
			return ParseStatus.mergeArray(status, results);
		});
		else return ParseStatus.mergeArray(status, items);
	}
	get items() {
		return this._def.items;
	}
	rest(rest) {
		return new ZodTuple({
			...this._def,
			rest
		});
	}
};
ZodTuple.create = (schemas, params) => {
	if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
	return new ZodTuple({
		items: schemas,
		typeName: ZodFirstPartyTypeKind.ZodTuple,
		rest: null,
		...processCreateParams(params)
	});
};
var ZodRecord = class ZodRecord extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const pairs = [];
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		for (const key in ctx.data) pairs.push({
			key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
			value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
			alwaysSet: key in ctx.data
		});
		if (ctx.common.async) return ParseStatus.mergeObjectAsync(status, pairs);
		else return ParseStatus.mergeObjectSync(status, pairs);
	}
	get element() {
		return this._def.valueType;
	}
	static create(first, second, third) {
		if (second instanceof ZodType) return new ZodRecord({
			keyType: first,
			valueType: second,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(third)
		});
		return new ZodRecord({
			keyType: ZodString.create(),
			valueType: first,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(second)
		});
	}
};
var ZodMap = class extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.map) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.map,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		const pairs = [...ctx.data.entries()].map(([key, value], index) => {
			return {
				key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
				value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
			};
		});
		if (ctx.common.async) {
			const finalMap = /* @__PURE__ */ new Map();
			return Promise.resolve().then(async () => {
				for (const pair of pairs) {
					const key = await pair.key;
					const value = await pair.value;
					if (key.status === "aborted" || value.status === "aborted") return INVALID;
					if (key.status === "dirty" || value.status === "dirty") status.dirty();
					finalMap.set(key.value, value.value);
				}
				return {
					status: status.value,
					value: finalMap
				};
			});
		} else {
			const finalMap = /* @__PURE__ */ new Map();
			for (const pair of pairs) {
				const key = pair.key;
				const value = pair.value;
				if (key.status === "aborted" || value.status === "aborted") return INVALID;
				if (key.status === "dirty" || value.status === "dirty") status.dirty();
				finalMap.set(key.value, value.value);
			}
			return {
				status: status.value,
				value: finalMap
			};
		}
	}
};
ZodMap.create = (keyType, valueType, params) => {
	return new ZodMap({
		valueType,
		keyType,
		typeName: ZodFirstPartyTypeKind.ZodMap,
		...processCreateParams(params)
	});
};
var ZodSet = class ZodSet extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.set) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.set,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const def = this._def;
		if (def.minSize !== null) {
			if (ctx.data.size < def.minSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.minSize.message
				});
				status.dirty();
			}
		}
		if (def.maxSize !== null) {
			if (ctx.data.size > def.maxSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.maxSize.message
				});
				status.dirty();
			}
		}
		const valueType = this._def.valueType;
		function finalizeSet(elements$1) {
			const parsedSet = /* @__PURE__ */ new Set();
			for (const element of elements$1) {
				if (element.status === "aborted") return INVALID;
				if (element.status === "dirty") status.dirty();
				parsedSet.add(element.value);
			}
			return {
				status: status.value,
				value: parsedSet
			};
		}
		const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
		if (ctx.common.async) return Promise.all(elements).then((elements$1) => finalizeSet(elements$1));
		else return finalizeSet(elements);
	}
	min(minSize, message) {
		return new ZodSet({
			...this._def,
			minSize: {
				value: minSize,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxSize, message) {
		return new ZodSet({
			...this._def,
			maxSize: {
				value: maxSize,
				message: errorUtil.toString(message)
			}
		});
	}
	size(size, message) {
		return this.min(size, message).max(size, message);
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodSet.create = (valueType, params) => {
	return new ZodSet({
		valueType,
		minSize: null,
		maxSize: null,
		typeName: ZodFirstPartyTypeKind.ZodSet,
		...processCreateParams(params)
	});
};
var ZodFunction = class ZodFunction extends ZodType {
	constructor() {
		super(...arguments);
		this.validate = this.implement;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.function) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.function,
				received: ctx.parsedType
			});
			return INVALID;
		}
		function makeArgsIssue(args, error) {
			return makeIssue({
				data: args,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					en_default
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_arguments,
					argumentsError: error
				}
			});
		}
		function makeReturnsIssue(returns, error) {
			return makeIssue({
				data: returns,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					en_default
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_return_type,
					returnTypeError: error
				}
			});
		}
		const params = { errorMap: ctx.common.contextualErrorMap };
		const fn = ctx.data;
		if (this._def.returns instanceof ZodPromise) {
			const me = this;
			return OK(async function(...args) {
				const error = new ZodError([]);
				const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
					error.addIssue(makeArgsIssue(args, e));
					throw error;
				});
				const result = await Reflect.apply(fn, this, parsedArgs);
				return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
					error.addIssue(makeReturnsIssue(result, e));
					throw error;
				});
			});
		} else {
			const me = this;
			return OK(function(...args) {
				const parsedArgs = me._def.args.safeParse(args, params);
				if (!parsedArgs.success) throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
				const result = Reflect.apply(fn, this, parsedArgs.data);
				const parsedReturns = me._def.returns.safeParse(result, params);
				if (!parsedReturns.success) throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
				return parsedReturns.data;
			});
		}
	}
	parameters() {
		return this._def.args;
	}
	returnType() {
		return this._def.returns;
	}
	args(...items) {
		return new ZodFunction({
			...this._def,
			args: ZodTuple.create(items).rest(ZodUnknown.create())
		});
	}
	returns(returnType) {
		return new ZodFunction({
			...this._def,
			returns: returnType
		});
	}
	implement(func) {
		return this.parse(func);
	}
	strictImplement(func) {
		return this.parse(func);
	}
	static create(args, returns, params) {
		return new ZodFunction({
			args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
			returns: returns || ZodUnknown.create(),
			typeName: ZodFirstPartyTypeKind.ZodFunction,
			...processCreateParams(params)
		});
	}
};
var ZodLazy = class extends ZodType {
	get schema() {
		return this._def.getter();
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		return this._def.getter()._parse({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
};
ZodLazy.create = (getter, params) => {
	return new ZodLazy({
		getter,
		typeName: ZodFirstPartyTypeKind.ZodLazy,
		...processCreateParams(params)
	});
};
var ZodLiteral = class extends ZodType {
	_parse(input) {
		if (input.data !== this._def.value) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_literal,
				expected: this._def.value
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
	get value() {
		return this._def.value;
	}
};
ZodLiteral.create = (value, params) => {
	return new ZodLiteral({
		value,
		typeName: ZodFirstPartyTypeKind.ZodLiteral,
		...processCreateParams(params)
	});
};
function createZodEnum(values, params) {
	return new ZodEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodEnum,
		...processCreateParams(params)
	});
}
var ZodEnum = class ZodEnum extends ZodType {
	_parse(input) {
		if (typeof input.data !== "string") {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				expected: util.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(this._def.values);
		if (!this._cache.has(input.data)) {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get options() {
		return this._def.values;
	}
	get enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Values() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	extract(values, newDef = this._def) {
		return ZodEnum.create(values, {
			...this._def,
			...newDef
		});
	}
	exclude(values, newDef = this._def) {
		return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
			...this._def,
			...newDef
		});
	}
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
	_parse(input) {
		const nativeEnumValues = util.getValidEnumValues(this._def.values);
		const ctx = this._getOrReturnCtx(input);
		if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
			const expectedValues = util.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				expected: util.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(util.getValidEnumValues(this._def.values));
		if (!this._cache.has(input.data)) {
			const expectedValues = util.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get enum() {
		return this._def.values;
	}
};
ZodNativeEnum.create = (values, params) => {
	return new ZodNativeEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
		...processCreateParams(params)
	});
};
var ZodPromise = class extends ZodType {
	unwrap() {
		return this._def.type;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.promise,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK((ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data)).then((data) => {
			return this._def.type.parseAsync(data, {
				path: ctx.path,
				errorMap: ctx.common.contextualErrorMap
			});
		}));
	}
};
ZodPromise.create = (schema, params) => {
	return new ZodPromise({
		type: schema,
		typeName: ZodFirstPartyTypeKind.ZodPromise,
		...processCreateParams(params)
	});
};
var ZodEffects = class extends ZodType {
	innerType() {
		return this._def.schema;
	}
	sourceType() {
		return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const effect = this._def.effect || null;
		const checkCtx = {
			addIssue: (arg) => {
				addIssueToContext(ctx, arg);
				if (arg.fatal) status.abort();
				else status.dirty();
			},
			get path() {
				return ctx.path;
			}
		};
		checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
		if (effect.type === "preprocess") {
			const processed = effect.transform(ctx.data, checkCtx);
			if (ctx.common.async) return Promise.resolve(processed).then(async (processed$1) => {
				if (status.value === "aborted") return INVALID;
				const result = await this._def.schema._parseAsync({
					data: processed$1,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			});
			else {
				if (status.value === "aborted") return INVALID;
				const result = this._def.schema._parseSync({
					data: processed,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			}
		}
		if (effect.type === "refinement") {
			const executeRefinement = (acc) => {
				const result = effect.refinement(acc, checkCtx);
				if (ctx.common.async) return Promise.resolve(result);
				if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
				return acc;
			};
			if (ctx.common.async === false) {
				const inner = this._def.schema._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				executeRefinement(inner.value);
				return {
					status: status.value,
					value: inner.value
				};
			} else return this._def.schema._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}).then((inner) => {
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				return executeRefinement(inner.value).then(() => {
					return {
						status: status.value,
						value: inner.value
					};
				});
			});
		}
		if (effect.type === "transform") if (ctx.common.async === false) {
			const base = this._def.schema._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (!isValid(base)) return INVALID;
			const result = effect.transform(base.value, checkCtx);
			if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
			return {
				status: status.value,
				value: result
			};
		} else return this._def.schema._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}).then((base) => {
			if (!isValid(base)) return INVALID;
			return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
				status: status.value,
				value: result
			}));
		});
		util.assertNever(effect);
	}
};
ZodEffects.create = (schema, effect, params) => {
	return new ZodEffects({
		schema,
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		effect,
		...processCreateParams(params)
	});
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
	return new ZodEffects({
		schema,
		effect: {
			type: "preprocess",
			transform: preprocess
		},
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		...processCreateParams(params)
	});
};
var ZodOptional = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.undefined) return OK(void 0);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodOptional.create = (type, params) => {
	return new ZodOptional({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodOptional,
		...processCreateParams(params)
	});
};
var ZodNullable = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.null) return OK(null);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodNullable.create = (type, params) => {
	return new ZodNullable({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodNullable,
		...processCreateParams(params)
	});
};
var ZodDefault = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		let data = ctx.data;
		if (ctx.parsedType === ZodParsedType.undefined) data = this._def.defaultValue();
		return this._def.innerType._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	removeDefault() {
		return this._def.innerType;
	}
};
ZodDefault.create = (type, params) => {
	return new ZodDefault({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodDefault,
		defaultValue: typeof params.default === "function" ? params.default : () => params.default,
		...processCreateParams(params)
	});
};
var ZodCatch = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const newCtx = {
			...ctx,
			common: {
				...ctx.common,
				issues: []
			}
		};
		const result = this._def.innerType._parse({
			data: newCtx.data,
			path: newCtx.path,
			parent: { ...newCtx }
		});
		if (isAsync(result)) return result.then((result$1) => {
			return {
				status: "valid",
				value: result$1.status === "valid" ? result$1.value : this._def.catchValue({
					get error() {
						return new ZodError(newCtx.common.issues);
					},
					input: newCtx.data
				})
			};
		});
		else return {
			status: "valid",
			value: result.status === "valid" ? result.value : this._def.catchValue({
				get error() {
					return new ZodError(newCtx.common.issues);
				},
				input: newCtx.data
			})
		};
	}
	removeCatch() {
		return this._def.innerType;
	}
};
ZodCatch.create = (type, params) => {
	return new ZodCatch({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodCatch,
		catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
		...processCreateParams(params)
	});
};
var ZodNaN = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.nan) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.nan,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
};
ZodNaN.create = (params) => {
	return new ZodNaN({
		typeName: ZodFirstPartyTypeKind.ZodNaN,
		...processCreateParams(params)
	});
};
var ZodBranded = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const data = ctx.data;
		return this._def.type._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	unwrap() {
		return this._def.type;
	}
};
var ZodPipeline = class ZodPipeline extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.common.async) {
			const handleAsync = async () => {
				const inResult = await this._def.in._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inResult.status === "aborted") return INVALID;
				if (inResult.status === "dirty") {
					status.dirty();
					return DIRTY(inResult.value);
				} else return this._def.out._parseAsync({
					data: inResult.value,
					path: ctx.path,
					parent: ctx
				});
			};
			return handleAsync();
		} else {
			const inResult = this._def.in._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (inResult.status === "aborted") return INVALID;
			if (inResult.status === "dirty") {
				status.dirty();
				return {
					status: "dirty",
					value: inResult.value
				};
			} else return this._def.out._parseSync({
				data: inResult.value,
				path: ctx.path,
				parent: ctx
			});
		}
	}
	static create(a, b) {
		return new ZodPipeline({
			in: a,
			out: b,
			typeName: ZodFirstPartyTypeKind.ZodPipeline
		});
	}
};
var ZodReadonly = class extends ZodType {
	_parse(input) {
		const result = this._def.innerType._parse(input);
		const freeze = (data) => {
			if (isValid(data)) data.value = Object.freeze(data.value);
			return data;
		};
		return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodReadonly.create = (type, params) => {
	return new ZodReadonly({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodReadonly,
		...processCreateParams(params)
	});
};
const late = { object: ZodObject.lazycreate };
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind$1) {
	ZodFirstPartyTypeKind$1["ZodString"] = "ZodString";
	ZodFirstPartyTypeKind$1["ZodNumber"] = "ZodNumber";
	ZodFirstPartyTypeKind$1["ZodNaN"] = "ZodNaN";
	ZodFirstPartyTypeKind$1["ZodBigInt"] = "ZodBigInt";
	ZodFirstPartyTypeKind$1["ZodBoolean"] = "ZodBoolean";
	ZodFirstPartyTypeKind$1["ZodDate"] = "ZodDate";
	ZodFirstPartyTypeKind$1["ZodSymbol"] = "ZodSymbol";
	ZodFirstPartyTypeKind$1["ZodUndefined"] = "ZodUndefined";
	ZodFirstPartyTypeKind$1["ZodNull"] = "ZodNull";
	ZodFirstPartyTypeKind$1["ZodAny"] = "ZodAny";
	ZodFirstPartyTypeKind$1["ZodUnknown"] = "ZodUnknown";
	ZodFirstPartyTypeKind$1["ZodNever"] = "ZodNever";
	ZodFirstPartyTypeKind$1["ZodVoid"] = "ZodVoid";
	ZodFirstPartyTypeKind$1["ZodArray"] = "ZodArray";
	ZodFirstPartyTypeKind$1["ZodObject"] = "ZodObject";
	ZodFirstPartyTypeKind$1["ZodUnion"] = "ZodUnion";
	ZodFirstPartyTypeKind$1["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
	ZodFirstPartyTypeKind$1["ZodIntersection"] = "ZodIntersection";
	ZodFirstPartyTypeKind$1["ZodTuple"] = "ZodTuple";
	ZodFirstPartyTypeKind$1["ZodRecord"] = "ZodRecord";
	ZodFirstPartyTypeKind$1["ZodMap"] = "ZodMap";
	ZodFirstPartyTypeKind$1["ZodSet"] = "ZodSet";
	ZodFirstPartyTypeKind$1["ZodFunction"] = "ZodFunction";
	ZodFirstPartyTypeKind$1["ZodLazy"] = "ZodLazy";
	ZodFirstPartyTypeKind$1["ZodLiteral"] = "ZodLiteral";
	ZodFirstPartyTypeKind$1["ZodEnum"] = "ZodEnum";
	ZodFirstPartyTypeKind$1["ZodEffects"] = "ZodEffects";
	ZodFirstPartyTypeKind$1["ZodNativeEnum"] = "ZodNativeEnum";
	ZodFirstPartyTypeKind$1["ZodOptional"] = "ZodOptional";
	ZodFirstPartyTypeKind$1["ZodNullable"] = "ZodNullable";
	ZodFirstPartyTypeKind$1["ZodDefault"] = "ZodDefault";
	ZodFirstPartyTypeKind$1["ZodCatch"] = "ZodCatch";
	ZodFirstPartyTypeKind$1["ZodPromise"] = "ZodPromise";
	ZodFirstPartyTypeKind$1["ZodBranded"] = "ZodBranded";
	ZodFirstPartyTypeKind$1["ZodPipeline"] = "ZodPipeline";
	ZodFirstPartyTypeKind$1["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;

//#endregion
//#region ../node_modules/eventsource-parser/dist/index.js
var ParseError = class extends Error {
	constructor(message, options) {
		super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
	}
};
function noop(_arg) {}
function createParser(callbacks) {
	if (typeof callbacks == "function") throw new TypeError("`callbacks` must be an object, got a function instead. Did you mean `{onEvent: fn}`?");
	const { onEvent = noop, onError = noop, onRetry = noop, onComment } = callbacks;
	let incompleteLine = "", isFirstChunk = !0, id, data = "", eventType = "";
	function feed(newChunk) {
		const chunk = isFirstChunk ? newChunk.replace(/^\xEF\xBB\xBF/, "") : newChunk, [complete, incomplete] = splitLines(`${incompleteLine}${chunk}`);
		for (const line of complete) parseLine(line);
		incompleteLine = incomplete, isFirstChunk = !1;
	}
	function parseLine(line) {
		if (line === "") {
			dispatchEvent();
			return;
		}
		if (line.startsWith(":")) {
			onComment && onComment(line.slice(line.startsWith(": ") ? 2 : 1));
			return;
		}
		const fieldSeparatorIndex = line.indexOf(":");
		if (fieldSeparatorIndex !== -1) {
			const field = line.slice(0, fieldSeparatorIndex), offset = line[fieldSeparatorIndex + 1] === " " ? 2 : 1;
			processField(field, line.slice(fieldSeparatorIndex + offset), line);
			return;
		}
		processField(line, "", line);
	}
	function processField(field, value, line) {
		switch (field) {
			case "event":
				eventType = value;
				break;
			case "data":
				data = `${data}${value}
`;
				break;
			case "id":
				id = value.includes("\0") ? void 0 : value;
				break;
			case "retry":
				/^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(new ParseError(`Invalid \`retry\` value: "${value}"`, {
					type: "invalid-retry",
					value,
					line
				}));
				break;
			default:
				onError(new ParseError(`Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`, {
					type: "unknown-field",
					field,
					value,
					line
				}));
				break;
		}
	}
	function dispatchEvent() {
		data.length > 0 && onEvent({
			id,
			event: eventType || void 0,
			data: data.endsWith(`
`) ? data.slice(0, -1) : data
		}), id = void 0, data = "", eventType = "";
	}
	function reset(options = {}) {
		incompleteLine && options.consume && parseLine(incompleteLine), isFirstChunk = !0, id = void 0, data = "", eventType = "", incompleteLine = "";
	}
	return {
		feed,
		reset
	};
}
function splitLines(chunk) {
	const lines = [];
	let incompleteLine = "", searchIndex = 0;
	for (; searchIndex < chunk.length;) {
		const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
		let lineEnd = -1;
		if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = Math.min(crIndex, lfIndex) : crIndex !== -1 ? crIndex === chunk.length - 1 ? lineEnd = -1 : lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1) {
			incompleteLine = chunk.slice(searchIndex);
			break;
		} else {
			const line = chunk.slice(searchIndex, lineEnd);
			lines.push(line), searchIndex = lineEnd + 1, chunk[searchIndex - 1] === "\r" && chunk[searchIndex] === `
` && searchIndex++;
		}
	}
	return [lines, incompleteLine];
}

//#endregion
//#region ../node_modules/eventsource-parser/dist/stream.js
var EventSourceParserStream = class extends TransformStream {
	constructor({ onError, onRetry, onComment } = {}) {
		let parser;
		super({
			start(controller) {
				parser = createParser({
					onEvent: (event) => {
						controller.enqueue(event);
					},
					onError(error) {
						onError === "terminate" ? controller.error(error) : typeof onError == "function" && onError(error);
					},
					onRetry,
					onComment
				});
			},
			transform(chunk) {
				parser.feed(chunk);
			}
		});
	}
};

//#endregion
//#region ../node_modules/@ai-sdk/provider-utils/dist/index.mjs
function combineHeaders(...headers) {
	return headers.reduce((combinedHeaders, currentHeaders) => ({
		...combinedHeaders,
		...currentHeaders != null ? currentHeaders : {}
	}), {});
}
async function delay(delayInMs, options) {
	if (delayInMs == null) return Promise.resolve();
	const signal = options == null ? void 0 : options.abortSignal;
	return new Promise((resolve2, reject) => {
		if (signal == null ? void 0 : signal.aborted) {
			reject(createAbortError());
			return;
		}
		const timeoutId = setTimeout(() => {
			cleanup();
			resolve2();
		}, delayInMs);
		const cleanup = () => {
			clearTimeout(timeoutId);
			signal?.removeEventListener("abort", onAbort);
		};
		const onAbort = () => {
			cleanup();
			reject(createAbortError());
		};
		signal?.addEventListener("abort", onAbort);
	});
}
function createAbortError() {
	return new DOMException("Delay was aborted", "AbortError");
}
var DelayedPromise = class {
	constructor() {
		this.status = { type: "pending" };
		this._resolve = void 0;
		this._reject = void 0;
	}
	get promise() {
		if (this._promise) return this._promise;
		this._promise = new Promise((resolve2, reject) => {
			if (this.status.type === "resolved") resolve2(this.status.value);
			else if (this.status.type === "rejected") reject(this.status.error);
			this._resolve = resolve2;
			this._reject = reject;
		});
		return this._promise;
	}
	resolve(value) {
		var _a2$3;
		this.status = {
			type: "resolved",
			value
		};
		if (this._promise) (_a2$3 = this._resolve) == null || _a2$3.call(this, value);
	}
	reject(error) {
		var _a2$3;
		this.status = {
			type: "rejected",
			error
		};
		if (this._promise) (_a2$3 = this._reject) == null || _a2$3.call(this, error);
	}
	isResolved() {
		return this.status.type === "resolved";
	}
	isRejected() {
		return this.status.type === "rejected";
	}
	isPending() {
		return this.status.type === "pending";
	}
};
function extractResponseHeaders(response) {
	return Object.fromEntries([...response.headers]);
}
var { btoa: btoa$1, atob: atob$1 } = globalThis;
function convertBase64ToUint8Array(base64String) {
	const latin1string = atob$1(base64String.replace(/-/g, "+").replace(/_/g, "/"));
	return Uint8Array.from(latin1string, (byte) => byte.codePointAt(0));
}
function convertUint8ArrayToBase64(array$2) {
	let latin1string = "";
	for (let i = 0; i < array$2.length; i++) latin1string += String.fromCodePoint(array$2[i]);
	return btoa$1(latin1string);
}
var name$2 = "AI_DownloadError";
var marker$1 = `vercel.ai.error.${name$2}`;
var symbol$2 = Symbol.for(marker$1);
var _a$2, _b$1;
var DownloadError = class extends (_b$1 = AISDKError, _a$2 = symbol$2, _b$1) {
	constructor({ url, statusCode, statusText, cause, message = cause == null ? `Failed to download ${url}: ${statusCode} ${statusText}` : `Failed to download ${url}: ${cause}` }) {
		super({
			name: name$2,
			message,
			cause
		});
		this[_a$2] = true;
		this.url = url;
		this.statusCode = statusCode;
		this.statusText = statusText;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker$1);
	}
};
var createIdGenerator = ({ prefix, size = 16, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", separator = "-" } = {}) => {
	const generator = () => {
		const alphabetLength = alphabet.length;
		const chars = new Array(size);
		for (let i = 0; i < size; i++) chars[i] = alphabet[Math.random() * alphabetLength | 0];
		return chars.join("");
	};
	if (prefix == null) return generator;
	if (alphabet.includes(separator)) throw new InvalidArgumentError$1({
		argument: "separator",
		message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
	});
	return () => `${prefix}${separator}${generator()}`;
};
var generateId = createIdGenerator();
function getErrorMessage(error) {
	if (error == null) return "unknown error";
	if (typeof error === "string") return error;
	if (error instanceof Error) return error.message;
	return JSON.stringify(error);
}
function isAbortError(error) {
	return (error instanceof Error || error instanceof DOMException) && (error.name === "AbortError" || error.name === "ResponseAborted" || error.name === "TimeoutError");
}
var FETCH_FAILED_ERROR_MESSAGES = ["fetch failed", "failed to fetch"];
var BUN_ERROR_CODES = [
	"ConnectionRefused",
	"ConnectionClosed",
	"FailedToOpenSocket",
	"ECONNRESET",
	"ECONNREFUSED",
	"ETIMEDOUT",
	"EPIPE"
];
function isBunNetworkError(error) {
	if (!(error instanceof Error)) return false;
	const code = error.code;
	if (typeof code === "string" && BUN_ERROR_CODES.includes(code)) return true;
	return false;
}
function handleFetchError({ error, url, requestBodyValues }) {
	if (isAbortError(error)) return error;
	if (error instanceof TypeError && FETCH_FAILED_ERROR_MESSAGES.includes(error.message.toLowerCase())) {
		const cause = error.cause;
		if (cause != null) return new APICallError({
			message: `Cannot connect to API: ${cause.message}`,
			cause,
			url,
			requestBodyValues,
			isRetryable: true
		});
	}
	if (isBunNetworkError(error)) return new APICallError({
		message: `Cannot connect to API: ${error.message}`,
		cause: error,
		url,
		requestBodyValues,
		isRetryable: true
	});
	return error;
}
function getRuntimeEnvironmentUserAgent(globalThisAny = globalThis) {
	var _a2$3, _b2$2, _c;
	if (globalThisAny.window) return `runtime/browser`;
	if ((_a2$3 = globalThisAny.navigator) == null ? void 0 : _a2$3.userAgent) return `runtime/${globalThisAny.navigator.userAgent.toLowerCase()}`;
	if ((_c = (_b2$2 = globalThisAny.process) == null ? void 0 : _b2$2.versions) == null ? void 0 : _c.node) return `runtime/node.js/${globalThisAny.process.version.substring(0)}`;
	if (globalThisAny.EdgeRuntime) return `runtime/vercel-edge`;
	return "runtime/unknown";
}
function normalizeHeaders(headers) {
	if (headers == null) return {};
	const normalized = {};
	if (headers instanceof Headers) headers.forEach((value, key) => {
		normalized[key.toLowerCase()] = value;
	});
	else {
		if (!Array.isArray(headers)) headers = Object.entries(headers);
		for (const [key, value] of headers) if (value != null) normalized[key.toLowerCase()] = value;
	}
	return normalized;
}
function withUserAgentSuffix(headers, ...userAgentSuffixParts) {
	const normalizedHeaders = new Headers(normalizeHeaders(headers));
	const currentUserAgentHeader = normalizedHeaders.get("user-agent") || "";
	normalizedHeaders.set("user-agent", [currentUserAgentHeader, ...userAgentSuffixParts].filter(Boolean).join(" "));
	return Object.fromEntries(normalizedHeaders.entries());
}
var VERSION$3 = "4.0.11";
var getOriginalFetch = () => globalThis.fetch;
var getFromApi = async ({ url, headers = {}, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch2 = getOriginalFetch() }) => {
	try {
		const response = await fetch2(url, {
			method: "GET",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION$3}`, getRuntimeEnvironmentUserAgent()),
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: {}
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: {}
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: {}
			});
		} catch (error) {
			if (error instanceof Error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
			}
			throw new APICallError({
				message: "Failed to process successful response",
				cause: error,
				statusCode: response.status,
				url,
				responseHeaders,
				requestBodyValues: {}
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: {}
		});
	}
};
function isNonNullable(value) {
	return value != null;
}
function isUrlSupported({ mediaType, url, supportedUrls }) {
	url = url.toLowerCase();
	mediaType = mediaType.toLowerCase();
	return Object.entries(supportedUrls).map(([key, value]) => {
		const mediaType2 = key.toLowerCase();
		return mediaType2 === "*" || mediaType2 === "*/*" ? {
			mediaTypePrefix: "",
			regexes: value
		} : {
			mediaTypePrefix: mediaType2.replace(/\*/, ""),
			regexes: value
		};
	}).filter(({ mediaTypePrefix }) => mediaType.startsWith(mediaTypePrefix)).flatMap(({ regexes }) => regexes).some((pattern) => pattern.test(url));
}
function loadOptionalSetting({ settingValue, environmentVariableName }) {
	if (typeof settingValue === "string") return settingValue;
	if (settingValue != null || typeof process === "undefined") return;
	settingValue = process.env[environmentVariableName];
	if (settingValue == null || typeof settingValue !== "string") return;
	return settingValue;
}
var suspectProtoRx = /"__proto__"\s*:/;
var suspectConstructorRx = /"constructor"\s*:/;
function _parse(text$1) {
	const obj = JSON.parse(text$1);
	if (obj === null || typeof obj !== "object") return obj;
	if (suspectProtoRx.test(text$1) === false && suspectConstructorRx.test(text$1) === false) return obj;
	return filter(obj);
}
function filter(obj) {
	let next = [obj];
	while (next.length) {
		const nodes = next;
		next = [];
		for (const node of nodes) {
			if (Object.prototype.hasOwnProperty.call(node, "__proto__")) throw new SyntaxError("Object contains forbidden prototype property");
			if (Object.prototype.hasOwnProperty.call(node, "constructor") && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) throw new SyntaxError("Object contains forbidden prototype property");
			for (const key in node) {
				const value = node[key];
				if (value && typeof value === "object") next.push(value);
			}
		}
	}
	return obj;
}
function secureJsonParse(text$1) {
	const { stackTraceLimit } = Error;
	try {
		Error.stackTraceLimit = 0;
	} catch (e) {
		return _parse(text$1);
	}
	try {
		return _parse(text$1);
	} finally {
		Error.stackTraceLimit = stackTraceLimit;
	}
}
function addAdditionalPropertiesToJsonSchema(jsonSchema2) {
	if (jsonSchema2.type === "object" || Array.isArray(jsonSchema2.type) && jsonSchema2.type.includes("object")) {
		jsonSchema2.additionalProperties = false;
		const { properties } = jsonSchema2;
		if (properties != null) for (const key of Object.keys(properties)) properties[key] = visit(properties[key]);
	}
	if (jsonSchema2.items != null) jsonSchema2.items = Array.isArray(jsonSchema2.items) ? jsonSchema2.items.map(visit) : visit(jsonSchema2.items);
	if (jsonSchema2.anyOf != null) jsonSchema2.anyOf = jsonSchema2.anyOf.map(visit);
	if (jsonSchema2.allOf != null) jsonSchema2.allOf = jsonSchema2.allOf.map(visit);
	if (jsonSchema2.oneOf != null) jsonSchema2.oneOf = jsonSchema2.oneOf.map(visit);
	const { definitions } = jsonSchema2;
	if (definitions != null) for (const key of Object.keys(definitions)) definitions[key] = visit(definitions[key]);
	return jsonSchema2;
}
function visit(def) {
	if (typeof def === "boolean") return def;
	return addAdditionalPropertiesToJsonSchema(def);
}
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
	name: void 0,
	$refStrategy: "root",
	basePath: ["#"],
	effectStrategy: "input",
	pipeStrategy: "all",
	dateStrategy: "format:date-time",
	mapStrategy: "entries",
	removeAdditionalStrategy: "passthrough",
	allowedAdditionalProperties: true,
	rejectedAdditionalProperties: false,
	definitionPath: "definitions",
	strictUnions: false,
	definitions: {},
	errorMessages: false,
	patternStrategy: "escape",
	applyRegexFlags: false,
	emailStrategy: "format:email",
	base64Strategy: "contentEncoding:base64",
	nameStrategy: "ref"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
	...defaultOptions,
	name: options
} : {
	...defaultOptions,
	...options
};
function parseAnyDef() {
	return {};
}
function parseArrayDef(def, refs) {
	var _a2$3, _b2$2, _c;
	const res = { type: "array" };
	if (((_a2$3 = def.type) == null ? void 0 : _a2$3._def) && ((_c = (_b2$2 = def.type) == null ? void 0 : _b2$2._def) == null ? void 0 : _c.typeName) !== ZodFirstPartyTypeKind.ZodAny) res.items = parseDef(def.type._def, {
		...refs,
		currentPath: [...refs.currentPath, "items"]
	});
	if (def.minLength) res.minItems = def.minLength.value;
	if (def.maxLength) res.maxItems = def.maxLength.value;
	if (def.exactLength) {
		res.minItems = def.exactLength.value;
		res.maxItems = def.exactLength.value;
	}
	return res;
}
function parseBigintDef(def) {
	const res = {
		type: "integer",
		format: "int64"
	};
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf":
			res.multipleOf = check.value;
			break;
	}
	return res;
}
function parseBooleanDef() {
	return { type: "boolean" };
}
function parseBrandedDef(_def, refs) {
	return parseDef(_def.type._def, refs);
}
var parseCatchDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
function parseDateDef(def, refs, overrideDateStrategy) {
	const strategy = overrideDateStrategy != null ? overrideDateStrategy : refs.dateStrategy;
	if (Array.isArray(strategy)) return { anyOf: strategy.map((item, i) => parseDateDef(def, refs, item)) };
	switch (strategy) {
		case "string":
		case "format:date-time": return {
			type: "string",
			format: "date-time"
		};
		case "format:date": return {
			type: "string",
			format: "date"
		};
		case "integer": return integerDateParser(def);
	}
}
var integerDateParser = (def) => {
	const res = {
		type: "integer",
		format: "unix-time"
	};
	for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minimum = check.value;
			break;
		case "max":
			res.maximum = check.value;
			break;
	}
	return res;
};
function parseDefaultDef(_def, refs) {
	return {
		...parseDef(_def.innerType._def, refs),
		default: _def.defaultValue()
	};
}
function parseEffectsDef(_def, refs) {
	return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef();
}
function parseEnumDef(def) {
	return {
		type: "string",
		enum: Array.from(def.values)
	};
}
var isJsonSchema7AllOfType = (type) => {
	if ("type" in type && type.type === "string") return false;
	return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
	const allOf = [parseDef(def.left._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	}), parseDef(def.right._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"1"
		]
	})].filter((x) => !!x);
	const mergedAllOf = [];
	allOf.forEach((schema) => {
		if (isJsonSchema7AllOfType(schema)) mergedAllOf.push(...schema.allOf);
		else {
			let nestedSchema = schema;
			if ("additionalProperties" in schema && schema.additionalProperties === false) {
				const { additionalProperties, ...rest } = schema;
				nestedSchema = rest;
			}
			mergedAllOf.push(nestedSchema);
		}
	});
	return mergedAllOf.length ? { allOf: mergedAllOf } : void 0;
}
function parseLiteralDef(def) {
	const parsedType = typeof def.value;
	if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") return { type: Array.isArray(def.value) ? "array" : "object" };
	return {
		type: parsedType === "bigint" ? "integer" : parsedType,
		const: def.value
	};
}
var emojiRegex = void 0;
var zodPatterns = {
	cuid: /^[cC][^\s-]{8,}$/,
	cuid2: /^[0-9a-z]+$/,
	ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
	email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
	emoji: () => {
		if (emojiRegex === void 0) emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
		return emojiRegex;
	},
	uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
	ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
	ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
	ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
	ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
	nanoid: /^[a-zA-Z0-9_-]{21}$/,
	jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
	const res = { type: "string" };
	if (def.checks) for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			break;
		case "max":
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "email":
			switch (refs.emailStrategy) {
				case "format:email":
					addFormat(res, "email", check.message, refs);
					break;
				case "format:idn-email":
					addFormat(res, "idn-email", check.message, refs);
					break;
				case "pattern:zod":
					addPattern(res, zodPatterns.email, check.message, refs);
					break;
			}
			break;
		case "url":
			addFormat(res, "uri", check.message, refs);
			break;
		case "uuid":
			addFormat(res, "uuid", check.message, refs);
			break;
		case "regex":
			addPattern(res, check.regex, check.message, refs);
			break;
		case "cuid":
			addPattern(res, zodPatterns.cuid, check.message, refs);
			break;
		case "cuid2":
			addPattern(res, zodPatterns.cuid2, check.message, refs);
			break;
		case "startsWith":
			addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
			break;
		case "endsWith":
			addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
			break;
		case "datetime":
			addFormat(res, "date-time", check.message, refs);
			break;
		case "date":
			addFormat(res, "date", check.message, refs);
			break;
		case "time":
			addFormat(res, "time", check.message, refs);
			break;
		case "duration":
			addFormat(res, "duration", check.message, refs);
			break;
		case "length":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "includes":
			addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
			break;
		case "ip":
			if (check.version !== "v6") addFormat(res, "ipv4", check.message, refs);
			if (check.version !== "v4") addFormat(res, "ipv6", check.message, refs);
			break;
		case "base64url":
			addPattern(res, zodPatterns.base64url, check.message, refs);
			break;
		case "jwt":
			addPattern(res, zodPatterns.jwt, check.message, refs);
			break;
		case "cidr":
			if (check.version !== "v6") addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
			if (check.version !== "v4") addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
			break;
		case "emoji":
			addPattern(res, zodPatterns.emoji(), check.message, refs);
			break;
		case "ulid":
			addPattern(res, zodPatterns.ulid, check.message, refs);
			break;
		case "base64":
			switch (refs.base64Strategy) {
				case "format:binary":
					addFormat(res, "binary", check.message, refs);
					break;
				case "contentEncoding:base64":
					res.contentEncoding = "base64";
					break;
				case "pattern:zod":
					addPattern(res, zodPatterns.base64, check.message, refs);
					break;
			}
			break;
		case "nanoid": addPattern(res, zodPatterns.nanoid, check.message, refs);
		case "toLowerCase":
		case "toUpperCase":
		case "trim": break;
		default:
	}
	return res;
}
function escapeLiteralCheckValue(literal$1, refs) {
	return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal$1) : literal$1;
}
var ALPHA_NUMERIC = /* @__PURE__ */ new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
	let result = "";
	for (let i = 0; i < source.length; i++) {
		if (!ALPHA_NUMERIC.has(source[i])) result += "\\";
		result += source[i];
	}
	return result;
}
function addFormat(schema, value, message, refs) {
	var _a2$3;
	if (schema.format || ((_a2$3 = schema.anyOf) == null ? void 0 : _a2$3.some((x) => x.format))) {
		if (!schema.anyOf) schema.anyOf = [];
		if (schema.format) {
			schema.anyOf.push({ format: schema.format });
			delete schema.format;
		}
		schema.anyOf.push({
			format: value,
			...message && refs.errorMessages && { errorMessage: { format: message } }
		});
	} else schema.format = value;
}
function addPattern(schema, regex, message, refs) {
	var _a2$3;
	if (schema.pattern || ((_a2$3 = schema.allOf) == null ? void 0 : _a2$3.some((x) => x.pattern))) {
		if (!schema.allOf) schema.allOf = [];
		if (schema.pattern) {
			schema.allOf.push({ pattern: schema.pattern });
			delete schema.pattern;
		}
		schema.allOf.push({
			pattern: stringifyRegExpWithFlags(regex, refs),
			...message && refs.errorMessages && { errorMessage: { pattern: message } }
		});
	} else schema.pattern = stringifyRegExpWithFlags(regex, refs);
}
function stringifyRegExpWithFlags(regex, refs) {
	var _a2$3;
	if (!refs.applyRegexFlags || !regex.flags) return regex.source;
	const flags = {
		i: regex.flags.includes("i"),
		m: regex.flags.includes("m"),
		s: regex.flags.includes("s")
	};
	const source = flags.i ? regex.source.toLowerCase() : regex.source;
	let pattern = "";
	let isEscaped = false;
	let inCharGroup = false;
	let inCharRange = false;
	for (let i = 0; i < source.length; i++) {
		if (isEscaped) {
			pattern += source[i];
			isEscaped = false;
			continue;
		}
		if (flags.i) {
			if (inCharGroup) {
				if (source[i].match(/[a-z]/)) {
					if (inCharRange) {
						pattern += source[i];
						pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
						inCharRange = false;
					} else if (source[i + 1] === "-" && ((_a2$3 = source[i + 2]) == null ? void 0 : _a2$3.match(/[a-z]/))) {
						pattern += source[i];
						inCharRange = true;
					} else pattern += `${source[i]}${source[i].toUpperCase()}`;
					continue;
				}
			} else if (source[i].match(/[a-z]/)) {
				pattern += `[${source[i]}${source[i].toUpperCase()}]`;
				continue;
			}
		}
		if (flags.m) {
			if (source[i] === "^") {
				pattern += `(^|(?<=[\r
]))`;
				continue;
			} else if (source[i] === "$") {
				pattern += `($|(?=[\r
]))`;
				continue;
			}
		}
		if (flags.s && source[i] === ".") {
			pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
			continue;
		}
		pattern += source[i];
		if (source[i] === "\\") isEscaped = true;
		else if (inCharGroup && source[i] === "]") inCharGroup = false;
		else if (!inCharGroup && source[i] === "[") inCharGroup = true;
	}
	try {
		new RegExp(pattern);
	} catch (e) {
		console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
		return regex.source;
	}
	return pattern;
}
function parseRecordDef(def, refs) {
	var _a2$3, _b2$2, _c, _d, _e, _f;
	const schema = {
		type: "object",
		additionalProperties: (_a2$3 = parseDef(def.valueType._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalProperties"]
		})) != null ? _a2$3 : refs.allowedAdditionalProperties
	};
	if (((_b2$2 = def.keyType) == null ? void 0 : _b2$2._def.typeName) === ZodFirstPartyTypeKind.ZodString && ((_c = def.keyType._def.checks) == null ? void 0 : _c.length)) {
		const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	} else if (((_d = def.keyType) == null ? void 0 : _d._def.typeName) === ZodFirstPartyTypeKind.ZodEnum) return {
		...schema,
		propertyNames: { enum: def.keyType._def.values }
	};
	else if (((_e = def.keyType) == null ? void 0 : _e._def.typeName) === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && ((_f = def.keyType._def.type._def.checks) == null ? void 0 : _f.length)) {
		const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	}
	return schema;
}
function parseMapDef(def, refs) {
	if (refs.mapStrategy === "record") return parseRecordDef(def, refs);
	return {
		type: "array",
		maxItems: 125,
		items: {
			type: "array",
			items: [parseDef(def.keyType._def, {
				...refs,
				currentPath: [
					...refs.currentPath,
					"items",
					"items",
					"0"
				]
			}) || parseAnyDef(), parseDef(def.valueType._def, {
				...refs,
				currentPath: [
					...refs.currentPath,
					"items",
					"items",
					"1"
				]
			}) || parseAnyDef()],
			minItems: 2,
			maxItems: 2
		}
	};
}
function parseNativeEnumDef(def) {
	const object$2 = def.values;
	const actualValues = Object.keys(def.values).filter((key) => {
		return typeof object$2[object$2[key]] !== "number";
	}).map((key) => object$2[key]);
	const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
	return {
		type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
		enum: actualValues
	};
}
function parseNeverDef() {
	return { not: parseAnyDef() };
}
function parseNullDef() {
	return { type: "null" };
}
var primitiveMappings = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBigInt: "integer",
	ZodBoolean: "boolean",
	ZodNull: "null"
};
function parseUnionDef(def, refs) {
	const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
	if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
		const types = options.reduce((types2, x) => {
			const type = primitiveMappings[x._def.typeName];
			return type && !types2.includes(type) ? [...types2, type] : types2;
		}, []);
		return { type: types.length > 1 ? types : types[0] };
	} else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
		const types = options.reduce((acc, x) => {
			const type = typeof x._def.value;
			switch (type) {
				case "string":
				case "number":
				case "boolean": return [...acc, type];
				case "bigint": return [...acc, "integer"];
				case "object": if (x._def.value === null) return [...acc, "null"];
				case "symbol":
				case "undefined":
				case "function":
				default: return acc;
			}
		}, []);
		if (types.length === options.length) {
			const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
			return {
				type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
				enum: options.reduce((acc, x) => {
					return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
				}, [])
			};
		}
	} else if (options.every((x) => x._def.typeName === "ZodEnum")) return {
		type: "string",
		enum: options.reduce((acc, x) => [...acc, ...x._def.values.filter((x2) => !acc.includes(x2))], [])
	};
	return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
	const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			`${i}`
		]
	})).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
	return anyOf.length ? { anyOf } : void 0;
};
function parseNullableDef(def, refs) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) return { type: [primitiveMappings[def.innerType._def.typeName], "null"] };
	const base = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"0"
		]
	});
	return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def) {
	const res = { type: "number" };
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "int":
			res.type = "integer";
			break;
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf":
			res.multipleOf = check.value;
			break;
	}
	return res;
}
function parseObjectDef(def, refs) {
	const result = {
		type: "object",
		properties: {}
	};
	const required$1 = [];
	const shape = def.shape();
	for (const propName in shape) {
		let propDef = shape[propName];
		if (propDef === void 0 || propDef._def === void 0) continue;
		const propOptional = safeIsOptional(propDef);
		const parsedDef = parseDef(propDef._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"properties",
				propName
			],
			propertyPath: [
				...refs.currentPath,
				"properties",
				propName
			]
		});
		if (parsedDef === void 0) continue;
		result.properties[propName] = parsedDef;
		if (!propOptional) required$1.push(propName);
	}
	if (required$1.length) result.required = required$1;
	const additionalProperties = decideAdditionalProperties(def, refs);
	if (additionalProperties !== void 0) result.additionalProperties = additionalProperties;
	return result;
}
function decideAdditionalProperties(def, refs) {
	if (def.catchall._def.typeName !== "ZodNever") return parseDef(def.catchall._def, {
		...refs,
		currentPath: [...refs.currentPath, "additionalProperties"]
	});
	switch (def.unknownKeys) {
		case "passthrough": return refs.allowedAdditionalProperties;
		case "strict": return refs.rejectedAdditionalProperties;
		case "strip": return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
	}
}
function safeIsOptional(schema) {
	try {
		return schema.isOptional();
	} catch (e) {
		return true;
	}
}
var parseOptionalDef = (def, refs) => {
	var _a2$3;
	if (refs.currentPath.toString() === ((_a2$3 = refs.propertyPath) == null ? void 0 : _a2$3.toString())) return parseDef(def.innerType._def, refs);
	const innerSchema = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"1"
		]
	});
	return innerSchema ? { anyOf: [{ not: parseAnyDef() }, innerSchema] } : parseAnyDef();
};
var parsePipelineDef = (def, refs) => {
	if (refs.pipeStrategy === "input") return parseDef(def.in._def, refs);
	else if (refs.pipeStrategy === "output") return parseDef(def.out._def, refs);
	const a = parseDef(def.in._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	});
	return { allOf: [a, parseDef(def.out._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			a ? "1" : "0"
		]
	})].filter((x) => x !== void 0) };
};
function parsePromiseDef(def, refs) {
	return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
	const schema = {
		type: "array",
		uniqueItems: true,
		items: parseDef(def.valueType._def, {
			...refs,
			currentPath: [...refs.currentPath, "items"]
		})
	};
	if (def.minSize) schema.minItems = def.minSize.value;
	if (def.maxSize) schema.maxItems = def.maxSize.value;
	return schema;
}
function parseTupleDef(def, refs) {
	if (def.rest) return {
		type: "array",
		minItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
		additionalItems: parseDef(def.rest._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalItems"]
		})
	};
	else return {
		type: "array",
		minItems: def.items.length,
		maxItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
	};
}
function parseUndefinedDef() {
	return { not: parseAnyDef() };
}
function parseUnknownDef() {
	return parseAnyDef();
}
var parseReadonlyDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
var selectParser = (def, typeName, refs) => {
	switch (typeName) {
		case ZodFirstPartyTypeKind.ZodString: return parseStringDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNumber: return parseNumberDef(def);
		case ZodFirstPartyTypeKind.ZodObject: return parseObjectDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBigInt: return parseBigintDef(def);
		case ZodFirstPartyTypeKind.ZodBoolean: return parseBooleanDef();
		case ZodFirstPartyTypeKind.ZodDate: return parseDateDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUndefined: return parseUndefinedDef();
		case ZodFirstPartyTypeKind.ZodNull: return parseNullDef();
		case ZodFirstPartyTypeKind.ZodArray: return parseArrayDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUnion:
		case ZodFirstPartyTypeKind.ZodDiscriminatedUnion: return parseUnionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodIntersection: return parseIntersectionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodTuple: return parseTupleDef(def, refs);
		case ZodFirstPartyTypeKind.ZodRecord: return parseRecordDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLiteral: return parseLiteralDef(def);
		case ZodFirstPartyTypeKind.ZodEnum: return parseEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNativeEnum: return parseNativeEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNullable: return parseNullableDef(def, refs);
		case ZodFirstPartyTypeKind.ZodOptional: return parseOptionalDef(def, refs);
		case ZodFirstPartyTypeKind.ZodMap: return parseMapDef(def, refs);
		case ZodFirstPartyTypeKind.ZodSet: return parseSetDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLazy: return () => def.getter()._def;
		case ZodFirstPartyTypeKind.ZodPromise: return parsePromiseDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNaN:
		case ZodFirstPartyTypeKind.ZodNever: return parseNeverDef();
		case ZodFirstPartyTypeKind.ZodEffects: return parseEffectsDef(def, refs);
		case ZodFirstPartyTypeKind.ZodAny: return parseAnyDef();
		case ZodFirstPartyTypeKind.ZodUnknown: return parseUnknownDef();
		case ZodFirstPartyTypeKind.ZodDefault: return parseDefaultDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBranded: return parseBrandedDef(def, refs);
		case ZodFirstPartyTypeKind.ZodReadonly: return parseReadonlyDef(def, refs);
		case ZodFirstPartyTypeKind.ZodCatch: return parseCatchDef(def, refs);
		case ZodFirstPartyTypeKind.ZodPipeline: return parsePipelineDef(def, refs);
		case ZodFirstPartyTypeKind.ZodFunction:
		case ZodFirstPartyTypeKind.ZodVoid:
		case ZodFirstPartyTypeKind.ZodSymbol: return;
		default: return /* @__PURE__ */ ((_) => void 0)(typeName);
	}
};
var getRelativePath = (pathA, pathB) => {
	let i = 0;
	for (; i < pathA.length && i < pathB.length; i++) if (pathA[i] !== pathB[i]) break;
	return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
function parseDef(def, refs, forceResolution = false) {
	var _a2$3;
	const seenItem = refs.seen.get(def);
	if (refs.override) {
		const overrideResult = (_a2$3 = refs.override) == null ? void 0 : _a2$3.call(refs, def, refs, seenItem, forceResolution);
		if (overrideResult !== ignoreOverride) return overrideResult;
	}
	if (seenItem && !forceResolution) {
		const seenSchema = get$ref(seenItem, refs);
		if (seenSchema !== void 0) return seenSchema;
	}
	const newItem = {
		def,
		path: refs.currentPath,
		jsonSchema: void 0
	};
	refs.seen.set(def, newItem);
	const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
	const jsonSchema2 = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
	if (jsonSchema2) addMeta(def, refs, jsonSchema2);
	if (refs.postProcess) {
		const postProcessResult = refs.postProcess(jsonSchema2, def, refs);
		newItem.jsonSchema = jsonSchema2;
		return postProcessResult;
	}
	newItem.jsonSchema = jsonSchema2;
	return jsonSchema2;
}
var get$ref = (item, refs) => {
	switch (refs.$refStrategy) {
		case "root": return { $ref: item.path.join("/") };
		case "relative": return { $ref: getRelativePath(refs.currentPath, item.path) };
		case "none":
		case "seen":
			if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
				console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
				return parseAnyDef();
			}
			return refs.$refStrategy === "seen" ? parseAnyDef() : void 0;
	}
};
var addMeta = (def, refs, jsonSchema2) => {
	if (def.description) jsonSchema2.description = def.description;
	return jsonSchema2;
};
var getRefs = (options) => {
	const _options = getDefaultOptions(options);
	const currentPath = _options.name !== void 0 ? [
		..._options.basePath,
		_options.definitionPath,
		_options.name
	] : _options.basePath;
	return {
		..._options,
		currentPath,
		propertyPath: void 0,
		seen: new Map(Object.entries(_options.definitions).map(([name2$3, def]) => [def._def, {
			def: def._def,
			path: [
				..._options.basePath,
				_options.definitionPath,
				name2$3
			],
			jsonSchema: void 0
		}]))
	};
};
var zod3ToJsonSchema = (schema, options) => {
	var _a2$3;
	const refs = getRefs(options);
	let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name3$3, schema2]) => {
		var _a3$3;
		return {
			...acc,
			[name3$3]: (_a3$3 = parseDef(schema2._def, {
				...refs,
				currentPath: [
					...refs.basePath,
					refs.definitionPath,
					name3$3
				]
			}, true)) != null ? _a3$3 : parseAnyDef()
		};
	}, {}) : void 0;
	const name2$3 = typeof options === "string" ? options : (options == null ? void 0 : options.nameStrategy) === "title" ? void 0 : options == null ? void 0 : options.name;
	const main = (_a2$3 = parseDef(schema._def, name2$3 === void 0 ? refs : {
		...refs,
		currentPath: [
			...refs.basePath,
			refs.definitionPath,
			name2$3
		]
	}, false)) != null ? _a2$3 : parseAnyDef();
	const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
	if (title !== void 0) main.title = title;
	const combined = name2$3 === void 0 ? definitions ? {
		...main,
		[refs.definitionPath]: definitions
	} : main : {
		$ref: [
			...refs.$refStrategy === "relative" ? [] : refs.basePath,
			refs.definitionPath,
			name2$3
		].join("/"),
		[refs.definitionPath]: {
			...definitions,
			[name2$3]: main
		}
	};
	combined.$schema = "http://json-schema.org/draft-07/schema#";
	return combined;
};
var schemaSymbol = Symbol.for("vercel.ai.schema");
function lazySchema(createSchema) {
	let schema;
	return () => {
		if (schema == null) schema = createSchema();
		return schema;
	};
}
function jsonSchema(jsonSchema2, { validate } = {}) {
	return {
		[schemaSymbol]: true,
		_type: void 0,
		get jsonSchema() {
			if (typeof jsonSchema2 === "function") jsonSchema2 = jsonSchema2();
			return jsonSchema2;
		},
		validate
	};
}
function isSchema(value) {
	return typeof value === "object" && value !== null && schemaSymbol in value && value[schemaSymbol] === true && "jsonSchema" in value && "validate" in value;
}
function asSchema(schema) {
	return schema == null ? jsonSchema({
		properties: {},
		additionalProperties: false
	}) : isSchema(schema) ? schema : "~standard" in schema ? schema["~standard"].vendor === "zod" ? zodSchema(schema) : standardSchema(schema) : schema();
}
function standardSchema(standardSchema2) {
	return jsonSchema(() => addAdditionalPropertiesToJsonSchema(standardSchema2["~standard"].jsonSchema.input({ target: "draft-07" })), { validate: async (value) => {
		const result = await standardSchema2["~standard"].validate(value);
		return "value" in result ? {
			success: true,
			value: result.value
		} : {
			success: false,
			error: new TypeValidationError({
				value,
				cause: result.issues
			})
		};
	} });
}
function zod3Schema(zodSchema2, options) {
	var _a2$3;
	const useReferences = (_a2$3 = options == null ? void 0 : options.useReferences) != null ? _a2$3 : false;
	return jsonSchema(() => zod3ToJsonSchema(zodSchema2, { $refStrategy: useReferences ? "root" : "none" }), { validate: async (value) => {
		const result = await zodSchema2.safeParseAsync(value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function zod4Schema(zodSchema2, options) {
	var _a2$3;
	const useReferences = (_a2$3 = options == null ? void 0 : options.useReferences) != null ? _a2$3 : false;
	return jsonSchema(() => addAdditionalPropertiesToJsonSchema(toJSONSchema(zodSchema2, {
		target: "draft-7",
		io: "input",
		reused: useReferences ? "ref" : "inline"
	})), { validate: async (value) => {
		const result = await safeParseAsync(zodSchema2, value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function isZod4Schema(zodSchema2) {
	return "_zod" in zodSchema2;
}
function zodSchema(zodSchema2, options) {
	if (isZod4Schema(zodSchema2)) return zod4Schema(zodSchema2, options);
	else return zod3Schema(zodSchema2, options);
}
async function validateTypes({ value, schema, context: context$1 }) {
	const result = await safeValidateTypes({
		value,
		schema,
		context: context$1
	});
	if (!result.success) throw TypeValidationError.wrap({
		value,
		cause: result.error,
		context: context$1
	});
	return result.value;
}
async function safeValidateTypes({ value, schema, context: context$1 }) {
	const actualSchema = asSchema(schema);
	try {
		if (actualSchema.validate == null) return {
			success: true,
			value,
			rawValue: value
		};
		const result = await actualSchema.validate(value);
		if (result.success) return {
			success: true,
			value: result.value,
			rawValue: value
		};
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: result.error,
				context: context$1
			}),
			rawValue: value
		};
	} catch (error) {
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: error,
				context: context$1
			}),
			rawValue: value
		};
	}
}
async function parseJSON({ text: text$1, schema }) {
	try {
		const value = secureJsonParse(text$1);
		if (schema == null) return value;
		return validateTypes({
			value,
			schema
		});
	} catch (error) {
		if (JSONParseError.isInstance(error) || TypeValidationError.isInstance(error)) throw error;
		throw new JSONParseError({
			text: text$1,
			cause: error
		});
	}
}
async function safeParseJSON({ text: text$1, schema }) {
	try {
		const value = secureJsonParse(text$1);
		if (schema == null) return {
			success: true,
			value,
			rawValue: value
		};
		return await safeValidateTypes({
			value,
			schema
		});
	} catch (error) {
		return {
			success: false,
			error: JSONParseError.isInstance(error) ? error : new JSONParseError({
				text: text$1,
				cause: error
			}),
			rawValue: void 0
		};
	}
}
function parseJsonEventStream({ stream, schema }) {
	return stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(new TransformStream({ async transform({ data }, controller) {
		if (data === "[DONE]") return;
		controller.enqueue(await safeParseJSON({
			text: data,
			schema
		}));
	} }));
}
async function parseProviderOptions({ provider, providerOptions, schema }) {
	if ((providerOptions == null ? void 0 : providerOptions[provider]) == null) return;
	const parsedProviderOptions = await safeValidateTypes({
		value: providerOptions[provider],
		schema
	});
	if (!parsedProviderOptions.success) throw new InvalidArgumentError$1({
		argument: "providerOptions",
		message: `invalid ${provider} provider options`,
		cause: parsedProviderOptions.error
	});
	return parsedProviderOptions.value;
}
var getOriginalFetch2 = () => globalThis.fetch;
var postJsonToApi = async ({ url, headers, body, failedResponseHandler, successfulResponseHandler, abortSignal, fetch: fetch2 }) => postToApi({
	url,
	headers: {
		"Content-Type": "application/json",
		...headers
	},
	body: {
		content: JSON.stringify(body),
		values: body
	},
	failedResponseHandler,
	successfulResponseHandler,
	abortSignal,
	fetch: fetch2
});
var postToApi = async ({ url, headers = {}, body, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch2 = getOriginalFetch2() }) => {
	try {
		const response = await fetch2(url, {
			method: "POST",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION$3}`, getRuntimeEnvironmentUserAgent()),
			body: body.content,
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: body.values
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: body.values
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: body.values
			});
		} catch (error) {
			if (error instanceof Error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
			}
			throw new APICallError({
				message: "Failed to process successful response",
				cause: error,
				statusCode: response.status,
				url,
				responseHeaders,
				requestBodyValues: body.values
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: body.values
		});
	}
};
function tool(tool2) {
	return tool2;
}
function createProviderToolFactoryWithOutputSchema({ id, inputSchema, outputSchema: outputSchema$1, supportsDeferredResults }) {
	return ({ execute, needsApproval, toModelOutput, onInputStart, onInputDelta, onInputAvailable, ...args }) => tool({
		type: "provider",
		id,
		args,
		inputSchema,
		outputSchema: outputSchema$1,
		execute,
		needsApproval,
		toModelOutput,
		onInputStart,
		onInputDelta,
		onInputAvailable,
		supportsDeferredResults
	});
}
async function resolve(value) {
	if (typeof value === "function") value = value();
	return Promise.resolve(value);
}
var createJsonErrorResponseHandler = ({ errorSchema, errorToMessage, isRetryable }) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await response.text();
	const responseHeaders = extractResponseHeaders(response);
	if (responseBody.trim() === "") return {
		responseHeaders,
		value: new APICallError({
			message: response.statusText,
			url,
			requestBodyValues,
			statusCode: response.status,
			responseHeaders,
			responseBody,
			isRetryable: isRetryable == null ? void 0 : isRetryable(response)
		})
	};
	try {
		const parsedError = await parseJSON({
			text: responseBody,
			schema: errorSchema
		});
		return {
			responseHeaders,
			value: new APICallError({
				message: errorToMessage(parsedError),
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				data: parsedError,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response, parsedError)
			})
		};
	} catch (parseError) {
		return {
			responseHeaders,
			value: new APICallError({
				message: response.statusText,
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response)
			})
		};
	}
};
var createEventSourceResponseHandler = (chunkSchema) => async ({ response }) => {
	const responseHeaders = extractResponseHeaders(response);
	if (response.body == null) throw new EmptyResponseBodyError({});
	return {
		responseHeaders,
		value: parseJsonEventStream({
			stream: response.body,
			schema: chunkSchema
		})
	};
};
var createJsonResponseHandler = (responseSchema) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await response.text();
	const parsedResult = await safeParseJSON({
		text: responseBody,
		schema: responseSchema
	});
	const responseHeaders = extractResponseHeaders(response);
	if (!parsedResult.success) throw new APICallError({
		message: "Invalid JSON response",
		cause: parsedResult.error,
		statusCode: response.status,
		responseHeaders,
		responseBody,
		url,
		requestBodyValues
	});
	return {
		responseHeaders,
		value: parsedResult.value,
		rawValue: parsedResult.rawValue
	};
};
function withoutTrailingSlash(url) {
	return url == null ? void 0 : url.replace(/\/$/, "");
}
function isAsyncIterable(obj) {
	return obj != null && typeof obj[Symbol.asyncIterator] === "function";
}
async function* executeTool({ execute, input, options }) {
	const result = execute(input, options);
	if (isAsyncIterable(result)) {
		let lastOutput;
		for await (const output of result) {
			lastOutput = output;
			yield {
				type: "preliminary",
				output
			};
		}
		yield {
			type: "final",
			output: lastOutput
		};
	} else yield {
		type: "final",
		output: await result
	};
}

//#endregion
//#region ../node_modules/@vercel/oidc/dist/get-context.js
var require_get_context = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __defProp$3 = Object.defineProperty;
	var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames$2 = Object.getOwnPropertyNames;
	var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
	var __export$3 = (target, all) => {
		for (var name$4 in all) __defProp$3(target, name$4, {
			get: all[name$4],
			enumerable: true
		});
	};
	var __copyProps$2 = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (let key of __getOwnPropNames$2(from)) if (!__hasOwnProp$2.call(to, key) && key !== except) __defProp$3(to, key, {
				get: () => from[key],
				enumerable: !(desc = __getOwnPropDesc$2(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toCommonJS$2 = (mod) => __copyProps$2(__defProp$3({}, "__esModule", { value: true }), mod);
	var get_context_exports = {};
	__export$3(get_context_exports, {
		SYMBOL_FOR_REQ_CONTEXT: () => SYMBOL_FOR_REQ_CONTEXT,
		getContext: () => getContext$1
	});
	module.exports = __toCommonJS$2(get_context_exports);
	const SYMBOL_FOR_REQ_CONTEXT = Symbol.for("@vercel/request-context");
	function getContext$1() {
		return globalThis[SYMBOL_FOR_REQ_CONTEXT]?.get?.() ?? {};
	}
}));

//#endregion
//#region ../node_modules/@vercel/oidc/dist/get-vercel-oidc-token.js
var require_get_vercel_oidc_token = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __defProp$2 = Object.defineProperty;
	var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames$1 = Object.getOwnPropertyNames;
	var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
	var __export$2 = (target, all) => {
		for (var name$4 in all) __defProp$2(target, name$4, {
			get: all[name$4],
			enumerable: true
		});
	};
	var __copyProps$1 = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (let key of __getOwnPropNames$1(from)) if (!__hasOwnProp$1.call(to, key) && key !== except) __defProp$2(to, key, {
				get: () => from[key],
				enumerable: !(desc = __getOwnPropDesc$1(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toCommonJS$1 = (mod) => __copyProps$1(__defProp$2({}, "__esModule", { value: true }), mod);
	var get_vercel_oidc_token_exports = {};
	__export$2(get_vercel_oidc_token_exports, {
		getVercelOidcToken: () => getVercelOidcToken$1,
		getVercelOidcTokenSync: () => getVercelOidcTokenSync
	});
	module.exports = __toCommonJS$1(get_vercel_oidc_token_exports);
	var import_get_context$1 = require_get_context();
	var import_token_error = require_token_error();
	async function getVercelOidcToken$1() {
		let token = "";
		let err;
		try {
			token = getVercelOidcTokenSync();
		} catch (error) {
			err = error;
		}
		try {
			const [{ getTokenPayload, isExpired }, { refreshToken }] = await Promise.all([await import("./token-util-DAZZwYum.mjs").then(__toDynamicImportESM()), await import("./token-D49gBdDK.mjs").then(__toDynamicImportESM())]);
			if (!token || isExpired(getTokenPayload(token))) {
				await refreshToken();
				token = getVercelOidcTokenSync();
			}
		} catch (error) {
			let message = err instanceof Error ? err.message : "";
			if (error instanceof Error) message = `${message}
${error.message}`;
			if (message) throw new import_token_error.VercelOidcTokenError(message);
			throw error;
		}
		return token;
	}
	function getVercelOidcTokenSync() {
		const token = (0, import_get_context$1.getContext)().headers?.["x-vercel-oidc-token"] ?? process.env.VERCEL_OIDC_TOKEN;
		if (!token) throw new Error(`The 'x-vercel-oidc-token' header is missing from the request. Do you have the OIDC option enabled in the Vercel project settings?`);
		return token;
	}
}));

//#endregion
//#region ../node_modules/@vercel/oidc/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __defProp$1 = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __export$1 = (target, all) => {
		for (var name$4 in all) __defProp$1(target, name$4, {
			get: all[name$4],
			enumerable: true
		});
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp$1(to, key, {
				get: () => from[key],
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toCommonJS = (mod) => __copyProps(__defProp$1({}, "__esModule", { value: true }), mod);
	var src_exports = {};
	__export$1(src_exports, {
		getContext: () => import_get_context.getContext,
		getVercelOidcToken: () => import_get_vercel_oidc_token.getVercelOidcToken,
		getVercelOidcTokenSync: () => import_get_vercel_oidc_token.getVercelOidcTokenSync
	});
	module.exports = __toCommonJS(src_exports);
	var import_get_vercel_oidc_token = require_get_vercel_oidc_token();
	var import_get_context = require_get_context();
}));

//#endregion
//#region ../node_modules/@ai-sdk/gateway/dist/index.mjs
var import_dist = require_dist();
var import_dist$1 = require_dist();
var symbol$1 = Symbol.for("vercel.ai.gateway.error");
var _a$1, _b;
var GatewayError = class _GatewayError extends (_b = Error, _a$1 = symbol$1, _b) {
	constructor({ message, statusCode = 500, cause, generationId }) {
		super(generationId ? `${message} [${generationId}]` : message);
		this[_a$1] = true;
		this.statusCode = statusCode;
		this.cause = cause;
		this.generationId = generationId;
	}
	/**
	* Checks if the given error is a Gateway Error.
	* @param {unknown} error - The error to check.
	* @returns {boolean} True if the error is a Gateway Error, false otherwise.
	*/
	static isInstance(error) {
		return _GatewayError.hasMarker(error);
	}
	static hasMarker(error) {
		return typeof error === "object" && error !== null && symbol$1 in error && error[symbol$1] === true;
	}
};
var name$1 = "GatewayAuthenticationError";
var marker2$1 = `vercel.ai.gateway.error.${name$1}`;
var symbol2$1 = Symbol.for(marker2$1);
var _a2$1, _b2;
var GatewayAuthenticationError = class _GatewayAuthenticationError extends (_b2 = GatewayError, _a2$1 = symbol2$1, _b2) {
	constructor({ message = "Authentication failed", statusCode = 401, cause, generationId } = {}) {
		super({
			message,
			statusCode,
			cause,
			generationId
		});
		this[_a2$1] = true;
		this.name = name$1;
		this.type = "authentication_error";
	}
	static isInstance(error) {
		return GatewayError.hasMarker(error) && symbol2$1 in error;
	}
	/**
	* Creates a contextual error message when authentication fails
	*/
	static createContextualError({ apiKeyProvided, oidcTokenProvided, message = "Authentication failed", statusCode = 401, cause, generationId }) {
		let contextualMessage;
		if (apiKeyProvided) contextualMessage = `AI Gateway authentication failed: Invalid API key.

Create a new API key: https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys

Provide via 'apiKey' option or 'AI_GATEWAY_API_KEY' environment variable.`;
		else if (oidcTokenProvided) contextualMessage = `AI Gateway authentication failed: Invalid OIDC token.

Run 'npx vercel link' to link your project, then 'vc env pull' to fetch the token.

Alternatively, use an API key: https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys`;
		else contextualMessage = `AI Gateway authentication failed: No authentication provided.

Option 1 - API key:
Create an API key: https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys
Provide via 'apiKey' option or 'AI_GATEWAY_API_KEY' environment variable.

Option 2 - OIDC token:
Run 'npx vercel link' to link your project, then 'vc env pull' to fetch the token.`;
		return new _GatewayAuthenticationError({
			message: contextualMessage,
			statusCode,
			cause,
			generationId
		});
	}
};
var name2$1 = "GatewayInvalidRequestError";
var marker3$1 = `vercel.ai.gateway.error.${name2$1}`;
var symbol3$1 = Symbol.for(marker3$1);
var _a3$1, _b3;
var GatewayInvalidRequestError = class extends (_b3 = GatewayError, _a3$1 = symbol3$1, _b3) {
	constructor({ message = "Invalid request", statusCode = 400, cause, generationId } = {}) {
		super({
			message,
			statusCode,
			cause,
			generationId
		});
		this[_a3$1] = true;
		this.name = name2$1;
		this.type = "invalid_request_error";
	}
	static isInstance(error) {
		return GatewayError.hasMarker(error) && symbol3$1 in error;
	}
};
var name3$1 = "GatewayRateLimitError";
var marker4$1 = `vercel.ai.gateway.error.${name3$1}`;
var symbol4$1 = Symbol.for(marker4$1);
var _a4$1, _b4;
var GatewayRateLimitError = class extends (_b4 = GatewayError, _a4$1 = symbol4$1, _b4) {
	constructor({ message = "Rate limit exceeded", statusCode = 429, cause, generationId } = {}) {
		super({
			message,
			statusCode,
			cause,
			generationId
		});
		this[_a4$1] = true;
		this.name = name3$1;
		this.type = "rate_limit_exceeded";
	}
	static isInstance(error) {
		return GatewayError.hasMarker(error) && symbol4$1 in error;
	}
};
var name4$1 = "GatewayModelNotFoundError";
var marker5$1 = `vercel.ai.gateway.error.${name4$1}`;
var symbol5$1 = Symbol.for(marker5$1);
var modelNotFoundParamSchema = lazySchema(() => zodSchema(object$1({ modelId: string() })));
var _a5$1, _b5;
var GatewayModelNotFoundError = class extends (_b5 = GatewayError, _a5$1 = symbol5$1, _b5) {
	constructor({ message = "Model not found", statusCode = 404, modelId, cause, generationId } = {}) {
		super({
			message,
			statusCode,
			cause,
			generationId
		});
		this[_a5$1] = true;
		this.name = name4$1;
		this.type = "model_not_found";
		this.modelId = modelId;
	}
	static isInstance(error) {
		return GatewayError.hasMarker(error) && symbol5$1 in error;
	}
};
var name5$1 = "GatewayInternalServerError";
var marker6$1 = `vercel.ai.gateway.error.${name5$1}`;
var symbol6$1 = Symbol.for(marker6$1);
var _a6$1, _b6;
var GatewayInternalServerError = class extends (_b6 = GatewayError, _a6$1 = symbol6$1, _b6) {
	constructor({ message = "Internal server error", statusCode = 500, cause, generationId } = {}) {
		super({
			message,
			statusCode,
			cause,
			generationId
		});
		this[_a6$1] = true;
		this.name = name5$1;
		this.type = "internal_server_error";
	}
	static isInstance(error) {
		return GatewayError.hasMarker(error) && symbol6$1 in error;
	}
};
var name6$1 = "GatewayResponseError";
var marker7$1 = `vercel.ai.gateway.error.${name6$1}`;
var symbol7$1 = Symbol.for(marker7$1);
var _a7$1, _b7;
var GatewayResponseError = class extends (_b7 = GatewayError, _a7$1 = symbol7$1, _b7) {
	constructor({ message = "Invalid response from Gateway", statusCode = 502, response, validationError, cause, generationId } = {}) {
		super({
			message,
			statusCode,
			cause,
			generationId
		});
		this[_a7$1] = true;
		this.name = name6$1;
		this.type = "response_error";
		this.response = response;
		this.validationError = validationError;
	}
	static isInstance(error) {
		return GatewayError.hasMarker(error) && symbol7$1 in error;
	}
};
async function createGatewayErrorFromResponse({ response, statusCode, defaultMessage = "Gateway request failed", cause, authMethod }) {
	var _a8$1;
	const parseResult = await safeValidateTypes({
		value: response,
		schema: gatewayErrorResponseSchema
	});
	if (!parseResult.success) {
		const rawGenerationId = typeof response === "object" && response !== null && "generationId" in response ? response.generationId : void 0;
		return new GatewayResponseError({
			message: `Invalid error response format: ${defaultMessage}`,
			statusCode,
			response,
			validationError: parseResult.error,
			cause,
			generationId: rawGenerationId
		});
	}
	const validatedResponse = parseResult.value;
	const errorType = validatedResponse.error.type;
	const message = validatedResponse.error.message;
	const generationId = (_a8$1 = validatedResponse.generationId) != null ? _a8$1 : void 0;
	switch (errorType) {
		case "authentication_error": return GatewayAuthenticationError.createContextualError({
			apiKeyProvided: authMethod === "api-key",
			oidcTokenProvided: authMethod === "oidc",
			statusCode,
			cause,
			generationId
		});
		case "invalid_request_error": return new GatewayInvalidRequestError({
			message,
			statusCode,
			cause,
			generationId
		});
		case "rate_limit_exceeded": return new GatewayRateLimitError({
			message,
			statusCode,
			cause,
			generationId
		});
		case "model_not_found": {
			const modelResult = await safeValidateTypes({
				value: validatedResponse.error.param,
				schema: modelNotFoundParamSchema
			});
			return new GatewayModelNotFoundError({
				message,
				statusCode,
				modelId: modelResult.success ? modelResult.value.modelId : void 0,
				cause,
				generationId
			});
		}
		case "internal_server_error": return new GatewayInternalServerError({
			message,
			statusCode,
			cause,
			generationId
		});
		default: return new GatewayInternalServerError({
			message,
			statusCode,
			cause,
			generationId
		});
	}
}
var gatewayErrorResponseSchema = lazySchema(() => zodSchema(object$1({
	error: object$1({
		message: string(),
		type: string().nullish(),
		param: unknown().nullish(),
		code: union([string(), number()]).nullish()
	}),
	generationId: string().nullish()
})));
function asGatewayError(error, authMethod) {
	var _a8$1;
	if (GatewayError.isInstance(error)) return error;
	if (APICallError.isInstance(error)) return createGatewayErrorFromResponse({
		response: extractApiCallResponse(error),
		statusCode: (_a8$1 = error.statusCode) != null ? _a8$1 : 500,
		defaultMessage: "Gateway request failed",
		cause: error,
		authMethod
	});
	return createGatewayErrorFromResponse({
		response: {},
		statusCode: 500,
		defaultMessage: error instanceof Error ? `Gateway request failed: ${error.message}` : "Unknown Gateway error",
		cause: error,
		authMethod
	});
}
function extractApiCallResponse(error) {
	if (error.data !== void 0) return error.data;
	if (error.responseBody != null) try {
		return JSON.parse(error.responseBody);
	} catch (e) {
		return error.responseBody;
	}
	return {};
}
var GATEWAY_AUTH_METHOD_HEADER = "ai-gateway-auth-method";
async function parseAuthMethod(headers) {
	const result = await safeValidateTypes({
		value: headers[GATEWAY_AUTH_METHOD_HEADER],
		schema: gatewayAuthMethodSchema
	});
	return result.success ? result.value : void 0;
}
var gatewayAuthMethodSchema = lazySchema(() => zodSchema(union([literal("api-key"), literal("oidc")])));
var GatewayFetchMetadata = class {
	constructor(config$1) {
		this.config = config$1;
	}
	async getAvailableModels() {
		try {
			const { value } = await getFromApi({
				url: `${this.config.baseURL}/config`,
				headers: await resolve(this.config.headers()),
				successfulResponseHandler: createJsonResponseHandler(gatewayAvailableModelsResponseSchema),
				failedResponseHandler: createJsonErrorResponseHandler({
					errorSchema: any(),
					errorToMessage: (data) => data
				}),
				fetch: this.config.fetch
			});
			return value;
		} catch (error) {
			throw await asGatewayError(error);
		}
	}
	async getCredits() {
		try {
			const { value } = await getFromApi({
				url: `${new URL(this.config.baseURL).origin}/v1/credits`,
				headers: await resolve(this.config.headers()),
				successfulResponseHandler: createJsonResponseHandler(gatewayCreditsResponseSchema),
				failedResponseHandler: createJsonErrorResponseHandler({
					errorSchema: any(),
					errorToMessage: (data) => data
				}),
				fetch: this.config.fetch
			});
			return value;
		} catch (error) {
			throw await asGatewayError(error);
		}
	}
};
var gatewayAvailableModelsResponseSchema = lazySchema(() => zodSchema(object$1({ models: array$1(object$1({
	id: string(),
	name: string(),
	description: string().nullish(),
	pricing: object$1({
		input: string(),
		output: string(),
		input_cache_read: string().nullish(),
		input_cache_write: string().nullish()
	}).transform(({ input, output, input_cache_read, input_cache_write }) => ({
		input,
		output,
		...input_cache_read ? { cachedInputTokens: input_cache_read } : {},
		...input_cache_write ? { cacheCreationInputTokens: input_cache_write } : {}
	})).nullish(),
	specification: object$1({
		specificationVersion: literal("v3"),
		provider: string(),
		modelId: string()
	}),
	modelType: _enum([
		"language",
		"embedding",
		"image"
	]).nullish()
})) })));
var gatewayCreditsResponseSchema = lazySchema(() => zodSchema(object$1({
	balance: string(),
	total_used: string()
}).transform(({ balance, total_used }) => ({
	balance,
	totalUsed: total_used
}))));
var GatewayLanguageModel = class {
	constructor(modelId, config$1) {
		this.modelId = modelId;
		this.config = config$1;
		this.specificationVersion = "v3";
		this.supportedUrls = { "*/*": [/.*/] };
	}
	get provider() {
		return this.config.provider;
	}
	async getArgs(options) {
		const { abortSignal: _abortSignal, ...optionsWithoutSignal } = options;
		return {
			args: this.maybeEncodeFileParts(optionsWithoutSignal),
			warnings: []
		};
	}
	async doGenerate(options) {
		const { args, warnings } = await this.getArgs(options);
		const { abortSignal } = options;
		const resolvedHeaders = await resolve(this.config.headers());
		try {
			const { responseHeaders, value: responseBody, rawValue: rawResponse } = await postJsonToApi({
				url: this.getUrl(),
				headers: combineHeaders(resolvedHeaders, options.headers, this.getModelConfigHeaders(this.modelId, false), await resolve(this.config.o11yHeaders)),
				body: args,
				successfulResponseHandler: createJsonResponseHandler(any()),
				failedResponseHandler: createJsonErrorResponseHandler({
					errorSchema: any(),
					errorToMessage: (data) => data
				}),
				...abortSignal && { abortSignal },
				fetch: this.config.fetch
			});
			return {
				...responseBody,
				request: { body: args },
				response: {
					headers: responseHeaders,
					body: rawResponse
				},
				warnings
			};
		} catch (error) {
			throw await asGatewayError(error, await parseAuthMethod(resolvedHeaders));
		}
	}
	async doStream(options) {
		const { args, warnings } = await this.getArgs(options);
		const { abortSignal } = options;
		const resolvedHeaders = await resolve(this.config.headers());
		try {
			const { value: response, responseHeaders } = await postJsonToApi({
				url: this.getUrl(),
				headers: combineHeaders(resolvedHeaders, options.headers, this.getModelConfigHeaders(this.modelId, true), await resolve(this.config.o11yHeaders)),
				body: args,
				successfulResponseHandler: createEventSourceResponseHandler(any()),
				failedResponseHandler: createJsonErrorResponseHandler({
					errorSchema: any(),
					errorToMessage: (data) => data
				}),
				...abortSignal && { abortSignal },
				fetch: this.config.fetch
			});
			return {
				stream: response.pipeThrough(new TransformStream({
					start(controller) {
						if (warnings.length > 0) controller.enqueue({
							type: "stream-start",
							warnings
						});
					},
					transform(chunk, controller) {
						if (chunk.success) {
							const streamPart = chunk.value;
							if (streamPart.type === "raw" && !options.includeRawChunks) return;
							if (streamPart.type === "response-metadata" && streamPart.timestamp && typeof streamPart.timestamp === "string") streamPart.timestamp = new Date(streamPart.timestamp);
							controller.enqueue(streamPart);
						} else controller.error(chunk.error);
					}
				})),
				request: { body: args },
				response: { headers: responseHeaders }
			};
		} catch (error) {
			throw await asGatewayError(error, await parseAuthMethod(resolvedHeaders));
		}
	}
	isFilePart(part) {
		return part && typeof part === "object" && "type" in part && part.type === "file";
	}
	/**
	* Encodes file parts in the prompt to base64. Mutates the passed options
	* instance directly to avoid copying the file data.
	* @param options - The options to encode.
	* @returns The options with the file parts encoded.
	*/
	maybeEncodeFileParts(options) {
		for (const message of options.prompt) for (const part of message.content) if (this.isFilePart(part)) {
			const filePart = part;
			if (filePart.data instanceof Uint8Array) {
				const buffer = Uint8Array.from(filePart.data);
				const base64Data = Buffer.from(buffer).toString("base64");
				filePart.data = new URL(`data:${filePart.mediaType || "application/octet-stream"};base64,${base64Data}`);
			}
		}
		return options;
	}
	getUrl() {
		return `${this.config.baseURL}/language-model`;
	}
	getModelConfigHeaders(modelId, streaming) {
		return {
			"ai-language-model-specification-version": "3",
			"ai-language-model-id": modelId,
			"ai-language-model-streaming": String(streaming)
		};
	}
};
var GatewayEmbeddingModel = class {
	constructor(modelId, config$1) {
		this.modelId = modelId;
		this.config = config$1;
		this.specificationVersion = "v3";
		this.maxEmbeddingsPerCall = 2048;
		this.supportsParallelCalls = true;
	}
	get provider() {
		return this.config.provider;
	}
	async doEmbed({ values, headers, abortSignal, providerOptions }) {
		var _a8$1;
		const resolvedHeaders = await resolve(this.config.headers());
		try {
			const { responseHeaders, value: responseBody, rawValue } = await postJsonToApi({
				url: this.getUrl(),
				headers: combineHeaders(resolvedHeaders, headers != null ? headers : {}, this.getModelConfigHeaders(), await resolve(this.config.o11yHeaders)),
				body: {
					values,
					...providerOptions ? { providerOptions } : {}
				},
				successfulResponseHandler: createJsonResponseHandler(gatewayEmbeddingResponseSchema),
				failedResponseHandler: createJsonErrorResponseHandler({
					errorSchema: any(),
					errorToMessage: (data) => data
				}),
				...abortSignal && { abortSignal },
				fetch: this.config.fetch
			});
			return {
				embeddings: responseBody.embeddings,
				usage: (_a8$1 = responseBody.usage) != null ? _a8$1 : void 0,
				providerMetadata: responseBody.providerMetadata,
				response: {
					headers: responseHeaders,
					body: rawValue
				},
				warnings: []
			};
		} catch (error) {
			throw await asGatewayError(error, await parseAuthMethod(resolvedHeaders));
		}
	}
	getUrl() {
		return `${this.config.baseURL}/embedding-model`;
	}
	getModelConfigHeaders() {
		return {
			"ai-embedding-model-specification-version": "3",
			"ai-model-id": this.modelId
		};
	}
};
var gatewayEmbeddingResponseSchema = lazySchema(() => zodSchema(object$1({
	embeddings: array$1(array$1(number())),
	usage: object$1({ tokens: number() }).nullish(),
	providerMetadata: record(string(), record(string(), unknown())).optional()
})));
var GatewayImageModel = class {
	constructor(modelId, config$1) {
		this.modelId = modelId;
		this.config = config$1;
		this.specificationVersion = "v3";
		this.maxImagesPerCall = Number.MAX_SAFE_INTEGER;
	}
	get provider() {
		return this.config.provider;
	}
	async doGenerate({ prompt, n, size, aspectRatio, seed, files, mask, providerOptions, headers, abortSignal }) {
		var _a8$1;
		const resolvedHeaders = await resolve(this.config.headers());
		try {
			const { responseHeaders, value: responseBody, rawValue } = await postJsonToApi({
				url: this.getUrl(),
				headers: combineHeaders(resolvedHeaders, headers != null ? headers : {}, this.getModelConfigHeaders(), await resolve(this.config.o11yHeaders)),
				body: {
					prompt,
					n,
					...size && { size },
					...aspectRatio && { aspectRatio },
					...seed && { seed },
					...providerOptions && { providerOptions },
					...files && { files: files.map((file) => maybeEncodeImageFile(file)) },
					...mask && { mask: maybeEncodeImageFile(mask) }
				},
				successfulResponseHandler: createJsonResponseHandler(gatewayImageResponseSchema),
				failedResponseHandler: createJsonErrorResponseHandler({
					errorSchema: any(),
					errorToMessage: (data) => data
				}),
				...abortSignal && { abortSignal },
				fetch: this.config.fetch
			});
			return {
				images: responseBody.images,
				warnings: (_a8$1 = responseBody.warnings) != null ? _a8$1 : [],
				providerMetadata: responseBody.providerMetadata,
				response: {
					timestamp: /* @__PURE__ */ new Date(),
					modelId: this.modelId,
					headers: responseHeaders
				}
			};
		} catch (error) {
			throw asGatewayError(error, await parseAuthMethod(resolvedHeaders));
		}
	}
	getUrl() {
		return `${this.config.baseURL}/image-model`;
	}
	getModelConfigHeaders() {
		return {
			"ai-image-model-specification-version": "3",
			"ai-model-id": this.modelId
		};
	}
};
function maybeEncodeImageFile(file) {
	if (file.type === "file" && file.data instanceof Uint8Array) return {
		...file,
		data: convertUint8ArrayToBase64(file.data)
	};
	return file;
}
var providerMetadataEntrySchema = object$1({ images: array$1(unknown()).optional() }).catchall(unknown());
var gatewayImageResponseSchema = object$1({
	images: array$1(string()),
	warnings: array$1(object$1({
		type: literal("other"),
		message: string()
	})).optional(),
	providerMetadata: record(string(), providerMetadataEntrySchema).optional()
});
var parallelSearchToolFactory = createProviderToolFactoryWithOutputSchema({
	id: "gateway.parallel_search",
	inputSchema: lazySchema(() => zodSchema(object$1({
		objective: string().describe("Natural-language description of the web research goal, including source or freshness guidance and broader context from the task. Maximum 5000 characters."),
		search_queries: array$1(string()).optional().describe("Optional search queries to supplement the objective. Maximum 200 characters per query."),
		mode: _enum(["one-shot", "agentic"]).optional().describe("Mode preset: \"one-shot\" for comprehensive results with longer excerpts (default), \"agentic\" for concise, token-efficient results for multi-step workflows."),
		max_results: number().optional().describe("Maximum number of results to return (1-20). Defaults to 10 if not specified."),
		source_policy: object$1({
			include_domains: array$1(string()).optional().describe("List of domains to include in search results."),
			exclude_domains: array$1(string()).optional().describe("List of domains to exclude from search results."),
			after_date: string().optional().describe("Only include results published after this date (ISO 8601 format).")
		}).optional().describe("Source policy for controlling which domains to include/exclude and freshness."),
		excerpts: object$1({
			max_chars_per_result: number().optional().describe("Maximum characters per result."),
			max_chars_total: number().optional().describe("Maximum total characters across all results.")
		}).optional().describe("Excerpt configuration for controlling result length."),
		fetch_policy: object$1({ max_age_seconds: number().optional().describe("Maximum age in seconds for cached content. Set to 0 to always fetch fresh content.") }).optional().describe("Fetch policy for controlling content freshness.")
	}))),
	outputSchema: lazySchema(() => zodSchema(union([object$1({
		searchId: string(),
		results: array$1(object$1({
			url: string(),
			title: string(),
			excerpt: string(),
			publishDate: string().nullable().optional(),
			relevanceScore: number().optional()
		}))
	}), object$1({
		error: _enum([
			"api_error",
			"rate_limit",
			"timeout",
			"invalid_input",
			"configuration_error",
			"unknown"
		]),
		statusCode: number().optional(),
		message: string()
	})])))
});
var parallelSearch = (config$1 = {}) => parallelSearchToolFactory(config$1);
var perplexitySearchToolFactory = createProviderToolFactoryWithOutputSchema({
	id: "gateway.perplexity_search",
	inputSchema: lazySchema(() => zodSchema(object$1({
		query: union([string(), array$1(string())]).describe("Search query (string) or multiple queries (array of up to 5 strings). Multi-query searches return combined results from all queries."),
		max_results: number().optional().describe("Maximum number of search results to return (1-20, default: 10)"),
		max_tokens_per_page: number().optional().describe("Maximum number of tokens to extract per search result page (256-2048, default: 2048)"),
		max_tokens: number().optional().describe("Maximum total tokens across all search results (default: 25000, max: 1000000)"),
		country: string().optional().describe("Two-letter ISO 3166-1 alpha-2 country code for regional search results (e.g., 'US', 'GB', 'FR')"),
		search_domain_filter: array$1(string()).optional().describe("List of domains to include or exclude from search results (max 20). To include: ['nature.com', 'science.org']. To exclude: ['-example.com', '-spam.net']"),
		search_language_filter: array$1(string()).optional().describe("List of ISO 639-1 language codes to filter results (max 10, lowercase). Examples: ['en', 'fr', 'de']"),
		search_after_date: string().optional().describe("Include only results published after this date. Format: 'MM/DD/YYYY' (e.g., '3/1/2025'). Cannot be used with search_recency_filter."),
		search_before_date: string().optional().describe("Include only results published before this date. Format: 'MM/DD/YYYY' (e.g., '3/15/2025'). Cannot be used with search_recency_filter."),
		last_updated_after_filter: string().optional().describe("Include only results last updated after this date. Format: 'MM/DD/YYYY' (e.g., '3/1/2025'). Cannot be used with search_recency_filter."),
		last_updated_before_filter: string().optional().describe("Include only results last updated before this date. Format: 'MM/DD/YYYY' (e.g., '3/15/2025'). Cannot be used with search_recency_filter."),
		search_recency_filter: _enum([
			"day",
			"week",
			"month",
			"year"
		]).optional().describe("Filter results by relative time period. Cannot be used with search_after_date or search_before_date.")
	}))),
	outputSchema: lazySchema(() => zodSchema(union([object$1({
		results: array$1(object$1({
			title: string(),
			url: string(),
			snippet: string(),
			date: string().optional(),
			lastUpdated: string().optional()
		})),
		id: string()
	}), object$1({
		error: _enum([
			"api_error",
			"rate_limit",
			"timeout",
			"invalid_input",
			"unknown"
		]),
		statusCode: number().optional(),
		message: string()
	})])))
});
var perplexitySearch = (config$1 = {}) => perplexitySearchToolFactory(config$1);
var gatewayTools = {
	parallelSearch,
	perplexitySearch
};
async function getVercelRequestId() {
	var _a8$1;
	return (_a8$1 = (0, import_dist.getContext)().headers) == null ? void 0 : _a8$1["x-vercel-id"];
}
var VERSION$2 = "3.0.29";
var AI_GATEWAY_PROTOCOL_VERSION = "0.0.1";
function createGatewayProvider(options = {}) {
	var _a8$1, _b8;
	let pendingMetadata = null;
	let metadataCache = null;
	const cacheRefreshMillis = (_a8$1 = options.metadataCacheRefreshMillis) != null ? _a8$1 : 1e3 * 60 * 5;
	let lastFetchTime = 0;
	const baseURL = (_b8 = withoutTrailingSlash(options.baseURL)) != null ? _b8 : "https://ai-gateway.vercel.sh/v3/ai";
	const getHeaders = async () => {
		try {
			const auth = await getGatewayAuthToken(options);
			return withUserAgentSuffix({
				Authorization: `Bearer ${auth.token}`,
				"ai-gateway-protocol-version": AI_GATEWAY_PROTOCOL_VERSION,
				[GATEWAY_AUTH_METHOD_HEADER]: auth.authMethod,
				...options.headers
			}, `ai-sdk/gateway/${VERSION$2}`);
		} catch (error) {
			throw GatewayAuthenticationError.createContextualError({
				apiKeyProvided: false,
				oidcTokenProvided: false,
				statusCode: 401,
				cause: error
			});
		}
	};
	const createO11yHeaders = () => {
		const deploymentId = loadOptionalSetting({
			settingValue: void 0,
			environmentVariableName: "VERCEL_DEPLOYMENT_ID"
		});
		const environment = loadOptionalSetting({
			settingValue: void 0,
			environmentVariableName: "VERCEL_ENV"
		});
		const region = loadOptionalSetting({
			settingValue: void 0,
			environmentVariableName: "VERCEL_REGION"
		});
		return async () => {
			const requestId = await getVercelRequestId();
			return {
				...deploymentId && { "ai-o11y-deployment-id": deploymentId },
				...environment && { "ai-o11y-environment": environment },
				...region && { "ai-o11y-region": region },
				...requestId && { "ai-o11y-request-id": requestId }
			};
		};
	};
	const createLanguageModel = (modelId) => {
		return new GatewayLanguageModel(modelId, {
			provider: "gateway",
			baseURL,
			headers: getHeaders,
			fetch: options.fetch,
			o11yHeaders: createO11yHeaders()
		});
	};
	const getAvailableModels = async () => {
		var _a9$1, _b9, _c;
		const now$1 = (_c = (_b9 = (_a9$1 = options._internal) == null ? void 0 : _a9$1.currentDate) == null ? void 0 : _b9.call(_a9$1).getTime()) != null ? _c : Date.now();
		if (!pendingMetadata || now$1 - lastFetchTime > cacheRefreshMillis) {
			lastFetchTime = now$1;
			pendingMetadata = new GatewayFetchMetadata({
				baseURL,
				headers: getHeaders,
				fetch: options.fetch
			}).getAvailableModels().then((metadata) => {
				metadataCache = metadata;
				return metadata;
			}).catch(async (error) => {
				throw await asGatewayError(error, await parseAuthMethod(await getHeaders()));
			});
		}
		return metadataCache ? Promise.resolve(metadataCache) : pendingMetadata;
	};
	const getCredits = async () => {
		return new GatewayFetchMetadata({
			baseURL,
			headers: getHeaders,
			fetch: options.fetch
		}).getCredits().catch(async (error) => {
			throw await asGatewayError(error, await parseAuthMethod(await getHeaders()));
		});
	};
	const provider = function(modelId) {
		if (new.target) throw new Error("The Gateway Provider model function cannot be called with the new keyword.");
		return createLanguageModel(modelId);
	};
	provider.specificationVersion = "v3";
	provider.getAvailableModels = getAvailableModels;
	provider.getCredits = getCredits;
	provider.imageModel = (modelId) => {
		return new GatewayImageModel(modelId, {
			provider: "gateway",
			baseURL,
			headers: getHeaders,
			fetch: options.fetch,
			o11yHeaders: createO11yHeaders()
		});
	};
	provider.languageModel = createLanguageModel;
	const createEmbeddingModel = (modelId) => {
		return new GatewayEmbeddingModel(modelId, {
			provider: "gateway",
			baseURL,
			headers: getHeaders,
			fetch: options.fetch,
			o11yHeaders: createO11yHeaders()
		});
	};
	provider.embeddingModel = createEmbeddingModel;
	provider.textEmbeddingModel = createEmbeddingModel;
	provider.tools = gatewayTools;
	return provider;
}
var gateway = createGatewayProvider();
async function getGatewayAuthToken(options) {
	const apiKey = loadOptionalSetting({
		settingValue: options.apiKey,
		environmentVariableName: "AI_GATEWAY_API_KEY"
	});
	if (apiKey) return {
		token: apiKey,
		authMethod: "api-key"
	};
	return {
		token: await (0, import_dist$1.getVercelOidcToken)(),
		authMethod: "oidc"
	};
}

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/platform/node/globalThis.js
/** only globals that common to node and browsers are allowed */
var _globalThis = typeof globalThis === "object" ? globalThis : global;

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/version.js
var VERSION$1 = "1.9.0";

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/internal/semver.js
var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
/**
* Create a function to test an API version to see if it is compatible with the provided ownVersion.
*
* The returned function has the following semantics:
* - Exact match is always compatible
* - Major versions must match exactly
*    - 1.x package cannot use global 2.x package
*    - 2.x package cannot use global 1.x package
* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
* - Patch and build tag differences are not considered at this time
*
* @param ownVersion version which should be checked against
*/
function _makeCompatibilityCheck(ownVersion) {
	var acceptedVersions = new Set([ownVersion]);
	var rejectedVersions = /* @__PURE__ */ new Set();
	var myVersionMatch = ownVersion.match(re);
	if (!myVersionMatch) return function() {
		return false;
	};
	var ownVersionParsed = {
		major: +myVersionMatch[1],
		minor: +myVersionMatch[2],
		patch: +myVersionMatch[3],
		prerelease: myVersionMatch[4]
	};
	if (ownVersionParsed.prerelease != null) return function isExactmatch(globalVersion) {
		return globalVersion === ownVersion;
	};
	function _reject(v) {
		rejectedVersions.add(v);
		return false;
	}
	function _accept(v) {
		acceptedVersions.add(v);
		return true;
	}
	return function isCompatible$1(globalVersion) {
		if (acceptedVersions.has(globalVersion)) return true;
		if (rejectedVersions.has(globalVersion)) return false;
		var globalVersionMatch = globalVersion.match(re);
		if (!globalVersionMatch) return _reject(globalVersion);
		var globalVersionParsed = {
			major: +globalVersionMatch[1],
			minor: +globalVersionMatch[2],
			patch: +globalVersionMatch[3],
			prerelease: globalVersionMatch[4]
		};
		if (globalVersionParsed.prerelease != null) return _reject(globalVersion);
		if (ownVersionParsed.major !== globalVersionParsed.major) return _reject(globalVersion);
		if (ownVersionParsed.major === 0) {
			if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) return _accept(globalVersion);
			return _reject(globalVersion);
		}
		if (ownVersionParsed.minor <= globalVersionParsed.minor) return _accept(globalVersion);
		return _reject(globalVersion);
	};
}
/**
* Test an API version to see if it is compatible with this API.
*
* - Exact match is always compatible
* - Major versions must match exactly
*    - 1.x package cannot use global 2.x package
*    - 2.x package cannot use global 1.x package
* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
* - Patch and build tag differences are not considered at this time
*
* @param version version of the API requesting an instance of the global API
*/
var isCompatible = _makeCompatibilityCheck(VERSION$1);

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/internal/global-utils.js
var major = VERSION$1.split(".")[0];
var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for("opentelemetry.js.api." + major);
var _global = _globalThis;
function registerGlobal(type, instance, diag, allowOverride) {
	var _a$5;
	if (allowOverride === void 0) allowOverride = false;
	var api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a$5 = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a$5 !== void 0 ? _a$5 : { version: VERSION$1 };
	if (!allowOverride && api[type]) {
		var err = /* @__PURE__ */ new Error("@opentelemetry/api: Attempted duplicate registration of API: " + type);
		diag.error(err.stack || err.message);
		return false;
	}
	if (api.version !== VERSION$1) {
		var err = /* @__PURE__ */ new Error("@opentelemetry/api: Registration of version v" + api.version + " for " + type + " does not match previously registered API v" + VERSION$1);
		diag.error(err.stack || err.message);
		return false;
	}
	api[type] = instance;
	diag.debug("@opentelemetry/api: Registered a global for " + type + " v" + VERSION$1 + ".");
	return true;
}
function getGlobal(type) {
	var _a$5, _b$3;
	var globalVersion = (_a$5 = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a$5 === void 0 ? void 0 : _a$5.version;
	if (!globalVersion || !isCompatible(globalVersion)) return;
	return (_b$3 = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b$3 === void 0 ? void 0 : _b$3[type];
}
function unregisterGlobal(type, diag) {
	diag.debug("@opentelemetry/api: Unregistering a global for " + type + " v" + VERSION$1 + ".");
	var api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
	if (api) delete api[type];
}

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js
var __read$3 = void 0 && (void 0).__read || function(o, n) {
	var m = typeof Symbol === "function" && o[Symbol.iterator];
	if (!m) return o;
	var i = m.call(o), r, ar = [], e;
	try {
		while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
	} catch (error) {
		e = { error };
	} finally {
		try {
			if (r && !r.done && (m = i["return"])) m.call(i);
		} finally {
			if (e) throw e.error;
		}
	}
	return ar;
};
var __spreadArray$3 = void 0 && (void 0).__spreadArray || function(to, from, pack) {
	if (pack || arguments.length === 2) {
		for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
			if (!ar) ar = Array.prototype.slice.call(from, 0, i);
			ar[i] = from[i];
		}
	}
	return to.concat(ar || Array.prototype.slice.call(from));
};
/**
* Component Logger which is meant to be used as part of any component which
* will add automatically additional namespace in front of the log message.
* It will then forward all message to global diag logger
* @example
* const cLogger = diag.createComponentLogger({ namespace: '@opentelemetry/instrumentation-http' });
* cLogger.debug('test');
* // @opentelemetry/instrumentation-http test
*/
var DiagComponentLogger = function() {
	function DiagComponentLogger$1(props) {
		this._namespace = props.namespace || "DiagComponentLogger";
	}
	DiagComponentLogger$1.prototype.debug = function() {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
		return logProxy("debug", this._namespace, args);
	};
	DiagComponentLogger$1.prototype.error = function() {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
		return logProxy("error", this._namespace, args);
	};
	DiagComponentLogger$1.prototype.info = function() {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
		return logProxy("info", this._namespace, args);
	};
	DiagComponentLogger$1.prototype.warn = function() {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
		return logProxy("warn", this._namespace, args);
	};
	DiagComponentLogger$1.prototype.verbose = function() {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
		return logProxy("verbose", this._namespace, args);
	};
	return DiagComponentLogger$1;
}();
function logProxy(funcName, namespace, args) {
	var logger = getGlobal("diag");
	if (!logger) return;
	args.unshift(namespace);
	return logger[funcName].apply(logger, __spreadArray$3([], __read$3(args), false));
}

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/diag/types.js
/**
* Defines the available internal logging levels for the diagnostic logger, the numeric values
* of the levels are defined to match the original values from the initial LogLevel to avoid
* compatibility/migration issues for any implementation that assume the numeric ordering.
*/
var DiagLogLevel;
(function(DiagLogLevel$1) {
	/** Diagnostic Logging level setting to disable all logging (except and forced logs) */
	DiagLogLevel$1[DiagLogLevel$1["NONE"] = 0] = "NONE";
	/** Identifies an error scenario */
	DiagLogLevel$1[DiagLogLevel$1["ERROR"] = 30] = "ERROR";
	/** Identifies a warning scenario */
	DiagLogLevel$1[DiagLogLevel$1["WARN"] = 50] = "WARN";
	/** General informational log message */
	DiagLogLevel$1[DiagLogLevel$1["INFO"] = 60] = "INFO";
	/** General debug log message */
	DiagLogLevel$1[DiagLogLevel$1["DEBUG"] = 70] = "DEBUG";
	/**
	* Detailed trace level logging should only be used for development, should only be set
	* in a development environment.
	*/
	DiagLogLevel$1[DiagLogLevel$1["VERBOSE"] = 80] = "VERBOSE";
	/** Used to set the logging level to include all logging */
	DiagLogLevel$1[DiagLogLevel$1["ALL"] = 9999] = "ALL";
})(DiagLogLevel || (DiagLogLevel = {}));

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js
function createLogLevelDiagLogger(maxLevel, logger) {
	if (maxLevel < DiagLogLevel.NONE) maxLevel = DiagLogLevel.NONE;
	else if (maxLevel > DiagLogLevel.ALL) maxLevel = DiagLogLevel.ALL;
	logger = logger || {};
	function _filterFunc(funcName, theLevel) {
		var theFunc = logger[funcName];
		if (typeof theFunc === "function" && maxLevel >= theLevel) return theFunc.bind(logger);
		return function() {};
	}
	return {
		error: _filterFunc("error", DiagLogLevel.ERROR),
		warn: _filterFunc("warn", DiagLogLevel.WARN),
		info: _filterFunc("info", DiagLogLevel.INFO),
		debug: _filterFunc("debug", DiagLogLevel.DEBUG),
		verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
	};
}

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/api/diag.js
var __read$2 = void 0 && (void 0).__read || function(o, n) {
	var m = typeof Symbol === "function" && o[Symbol.iterator];
	if (!m) return o;
	var i = m.call(o), r, ar = [], e;
	try {
		while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
	} catch (error) {
		e = { error };
	} finally {
		try {
			if (r && !r.done && (m = i["return"])) m.call(i);
		} finally {
			if (e) throw e.error;
		}
	}
	return ar;
};
var __spreadArray$2 = void 0 && (void 0).__spreadArray || function(to, from, pack) {
	if (pack || arguments.length === 2) {
		for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
			if (!ar) ar = Array.prototype.slice.call(from, 0, i);
			ar[i] = from[i];
		}
	}
	return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME$2 = "diag";
/**
* Singleton object which represents the entry point to the OpenTelemetry internal
* diagnostic API
*/
var DiagAPI = function() {
	/**
	* Private internal constructor
	* @private
	*/
	function DiagAPI$1() {
		function _logProxy(funcName) {
			return function() {
				var args = [];
				for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
				var logger = getGlobal("diag");
				if (!logger) return;
				return logger[funcName].apply(logger, __spreadArray$2([], __read$2(args), false));
			};
		}
		var self = this;
		var setLogger = function(logger, optionsOrLogLevel) {
			var _a$5, _b$3, _c;
			if (optionsOrLogLevel === void 0) optionsOrLogLevel = { logLevel: DiagLogLevel.INFO };
			if (logger === self) {
				var err = /* @__PURE__ */ new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
				self.error((_a$5 = err.stack) !== null && _a$5 !== void 0 ? _a$5 : err.message);
				return false;
			}
			if (typeof optionsOrLogLevel === "number") optionsOrLogLevel = { logLevel: optionsOrLogLevel };
			var oldLogger = getGlobal("diag");
			var newLogger = createLogLevelDiagLogger((_b$3 = optionsOrLogLevel.logLevel) !== null && _b$3 !== void 0 ? _b$3 : DiagLogLevel.INFO, logger);
			if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
				var stack = (_c = (/* @__PURE__ */ new Error()).stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
				oldLogger.warn("Current logger will be overwritten from " + stack);
				newLogger.warn("Current logger will overwrite one already registered from " + stack);
			}
			return registerGlobal("diag", newLogger, self, true);
		};
		self.setLogger = setLogger;
		self.disable = function() {
			unregisterGlobal(API_NAME$2, self);
		};
		self.createComponentLogger = function(options) {
			return new DiagComponentLogger(options);
		};
		self.verbose = _logProxy("verbose");
		self.debug = _logProxy("debug");
		self.info = _logProxy("info");
		self.warn = _logProxy("warn");
		self.error = _logProxy("error");
	}
	/** Get the singleton instance of the DiagAPI API */
	DiagAPI$1.instance = function() {
		if (!this._instance) this._instance = new DiagAPI$1();
		return this._instance;
	};
	return DiagAPI$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/context/context.js
/** Get a key to uniquely identify a context value */
function createContextKey(description) {
	return Symbol.for(description);
}
var BaseContext = function() {
	/**
	* Construct a new context which inherits values from an optional parent context.
	*
	* @param parentContext a context from which to inherit values
	*/
	function BaseContext$1(parentContext) {
		var self = this;
		self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
		self.getValue = function(key) {
			return self._currentContext.get(key);
		};
		self.setValue = function(key, value) {
			var context$1 = new BaseContext$1(self._currentContext);
			context$1._currentContext.set(key, value);
			return context$1;
		};
		self.deleteValue = function(key) {
			var context$1 = new BaseContext$1(self._currentContext);
			context$1._currentContext.delete(key);
			return context$1;
		};
	}
	return BaseContext$1;
}();
/** The root context is used as the default parent context when there is no active context */
var ROOT_CONTEXT = new BaseContext();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js
var __read$1 = void 0 && (void 0).__read || function(o, n) {
	var m = typeof Symbol === "function" && o[Symbol.iterator];
	if (!m) return o;
	var i = m.call(o), r, ar = [], e;
	try {
		while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
	} catch (error) {
		e = { error };
	} finally {
		try {
			if (r && !r.done && (m = i["return"])) m.call(i);
		} finally {
			if (e) throw e.error;
		}
	}
	return ar;
};
var __spreadArray$1 = void 0 && (void 0).__spreadArray || function(to, from, pack) {
	if (pack || arguments.length === 2) {
		for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
			if (!ar) ar = Array.prototype.slice.call(from, 0, i);
			ar[i] = from[i];
		}
	}
	return to.concat(ar || Array.prototype.slice.call(from));
};
var NoopContextManager = function() {
	function NoopContextManager$1() {}
	NoopContextManager$1.prototype.active = function() {
		return ROOT_CONTEXT;
	};
	NoopContextManager$1.prototype.with = function(_context, fn, thisArg) {
		var args = [];
		for (var _i = 3; _i < arguments.length; _i++) args[_i - 3] = arguments[_i];
		return fn.call.apply(fn, __spreadArray$1([thisArg], __read$1(args), false));
	};
	NoopContextManager$1.prototype.bind = function(_context, target) {
		return target;
	};
	NoopContextManager$1.prototype.enable = function() {
		return this;
	};
	NoopContextManager$1.prototype.disable = function() {
		return this;
	};
	return NoopContextManager$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/api/context.js
var __read = void 0 && (void 0).__read || function(o, n) {
	var m = typeof Symbol === "function" && o[Symbol.iterator];
	if (!m) return o;
	var i = m.call(o), r, ar = [], e;
	try {
		while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
	} catch (error) {
		e = { error };
	} finally {
		try {
			if (r && !r.done && (m = i["return"])) m.call(i);
		} finally {
			if (e) throw e.error;
		}
	}
	return ar;
};
var __spreadArray = void 0 && (void 0).__spreadArray || function(to, from, pack) {
	if (pack || arguments.length === 2) {
		for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
			if (!ar) ar = Array.prototype.slice.call(from, 0, i);
			ar[i] = from[i];
		}
	}
	return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME$1 = "context";
var NOOP_CONTEXT_MANAGER = new NoopContextManager();
/**
* Singleton object which represents the entry point to the OpenTelemetry Context API
*/
var ContextAPI = function() {
	/** Empty private constructor prevents end users from constructing a new instance of the API */
	function ContextAPI$1() {}
	/** Get the singleton instance of the Context API */
	ContextAPI$1.getInstance = function() {
		if (!this._instance) this._instance = new ContextAPI$1();
		return this._instance;
	};
	/**
	* Set the current context manager.
	*
	* @returns true if the context manager was successfully registered, else false
	*/
	ContextAPI$1.prototype.setGlobalContextManager = function(contextManager) {
		return registerGlobal(API_NAME$1, contextManager, DiagAPI.instance());
	};
	/**
	* Get the currently active context
	*/
	ContextAPI$1.prototype.active = function() {
		return this._getContextManager().active();
	};
	/**
	* Execute a function with an active context
	*
	* @param context context to be active during function execution
	* @param fn function to execute in a context
	* @param thisArg optional receiver to be used for calling fn
	* @param args optional arguments forwarded to fn
	*/
	ContextAPI$1.prototype.with = function(context$1, fn, thisArg) {
		var _a$5;
		var args = [];
		for (var _i = 3; _i < arguments.length; _i++) args[_i - 3] = arguments[_i];
		return (_a$5 = this._getContextManager()).with.apply(_a$5, __spreadArray([
			context$1,
			fn,
			thisArg
		], __read(args), false));
	};
	/**
	* Bind a context to a target function or event emitter
	*
	* @param context context to bind to the event emitter or function. Defaults to the currently active context
	* @param target function or event emitter to bind
	*/
	ContextAPI$1.prototype.bind = function(context$1, target) {
		return this._getContextManager().bind(context$1, target);
	};
	ContextAPI$1.prototype._getContextManager = function() {
		return getGlobal(API_NAME$1) || NOOP_CONTEXT_MANAGER;
	};
	/** Disable and remove the global context manager */
	ContextAPI$1.prototype.disable = function() {
		this._getContextManager().disable();
		unregisterGlobal(API_NAME$1, DiagAPI.instance());
	};
	return ContextAPI$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js
var TraceFlags;
(function(TraceFlags$1) {
	/** Represents no flag set. */
	TraceFlags$1[TraceFlags$1["NONE"] = 0] = "NONE";
	/** Bit to represent whether trace is sampled in trace flags. */
	TraceFlags$1[TraceFlags$1["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js
var INVALID_SPANID = "0000000000000000";
var INVALID_TRACEID = "00000000000000000000000000000000";
var INVALID_SPAN_CONTEXT = {
	traceId: INVALID_TRACEID,
	spanId: INVALID_SPANID,
	traceFlags: TraceFlags.NONE
};

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js
/**
* The NonRecordingSpan is the default {@link Span} that is used when no Span
* implementation is available. All operations are no-op including context
* propagation.
*/
var NonRecordingSpan = function() {
	function NonRecordingSpan$1(_spanContext) {
		if (_spanContext === void 0) _spanContext = INVALID_SPAN_CONTEXT;
		this._spanContext = _spanContext;
	}
	NonRecordingSpan$1.prototype.spanContext = function() {
		return this._spanContext;
	};
	NonRecordingSpan$1.prototype.setAttribute = function(_key, _value) {
		return this;
	};
	NonRecordingSpan$1.prototype.setAttributes = function(_attributes) {
		return this;
	};
	NonRecordingSpan$1.prototype.addEvent = function(_name, _attributes) {
		return this;
	};
	NonRecordingSpan$1.prototype.addLink = function(_link) {
		return this;
	};
	NonRecordingSpan$1.prototype.addLinks = function(_links) {
		return this;
	};
	NonRecordingSpan$1.prototype.setStatus = function(_status) {
		return this;
	};
	NonRecordingSpan$1.prototype.updateName = function(_name) {
		return this;
	};
	NonRecordingSpan$1.prototype.end = function(_endTime) {};
	NonRecordingSpan$1.prototype.isRecording = function() {
		return false;
	};
	NonRecordingSpan$1.prototype.recordException = function(_exception, _time) {};
	return NonRecordingSpan$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/context-utils.js
/**
* span key
*/
var SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
/**
* Return the span if one exists
*
* @param context context to get span from
*/
function getSpan(context$1) {
	return context$1.getValue(SPAN_KEY) || void 0;
}
/**
* Gets the span from the current context, if one exists.
*/
function getActiveSpan() {
	return getSpan(ContextAPI.getInstance().active());
}
/**
* Set the span on a context
*
* @param context context to use as parent
* @param span span to set active
*/
function setSpan(context$1, span) {
	return context$1.setValue(SPAN_KEY, span);
}
/**
* Remove current span stored in the context
*
* @param context context to delete span from
*/
function deleteSpan(context$1) {
	return context$1.deleteValue(SPAN_KEY);
}
/**
* Wrap span context in a NoopSpan and set as span in a new
* context
*
* @param context context to set active span on
* @param spanContext span context to be wrapped
*/
function setSpanContext(context$1, spanContext) {
	return setSpan(context$1, new NonRecordingSpan(spanContext));
}
/**
* Get the span context of the span if it exists.
*
* @param context context to get values from
*/
function getSpanContext(context$1) {
	var _a$5;
	return (_a$5 = getSpan(context$1)) === null || _a$5 === void 0 ? void 0 : _a$5.spanContext();
}

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js
var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
function isValidTraceId(traceId) {
	return VALID_TRACEID_REGEX.test(traceId) && traceId !== INVALID_TRACEID;
}
function isValidSpanId(spanId) {
	return VALID_SPANID_REGEX.test(spanId) && spanId !== INVALID_SPANID;
}
/**
* Returns true if this {@link SpanContext} is valid.
* @return true if this {@link SpanContext} is valid.
*/
function isSpanContextValid(spanContext) {
	return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
/**
* Wrap the given {@link SpanContext} in a new non-recording {@link Span}
*
* @param spanContext span context to be wrapped
* @returns a new non-recording {@link Span} with the provided context
*/
function wrapSpanContext(spanContext) {
	return new NonRecordingSpan(spanContext);
}

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js
var contextApi = ContextAPI.getInstance();
/**
* No-op implementations of {@link Tracer}.
*/
var NoopTracer = function() {
	function NoopTracer$1() {}
	NoopTracer$1.prototype.startSpan = function(name$4, options, context$1) {
		if (context$1 === void 0) context$1 = contextApi.active();
		if (Boolean(options === null || options === void 0 ? void 0 : options.root)) return new NonRecordingSpan();
		var parentFromContext = context$1 && getSpanContext(context$1);
		if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) return new NonRecordingSpan(parentFromContext);
		else return new NonRecordingSpan();
	};
	NoopTracer$1.prototype.startActiveSpan = function(name$4, arg2, arg3, arg4) {
		var opts;
		var ctx;
		var fn;
		if (arguments.length < 2) return;
		else if (arguments.length === 2) fn = arg2;
		else if (arguments.length === 3) {
			opts = arg2;
			fn = arg3;
		} else {
			opts = arg2;
			ctx = arg3;
			fn = arg4;
		}
		var parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
		var span = this.startSpan(name$4, opts, parentContext);
		var contextWithSpanSet = setSpan(parentContext, span);
		return contextApi.with(contextWithSpanSet, fn, void 0, span);
	};
	return NoopTracer$1;
}();
function isSpanContext(spanContext) {
	return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
}

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js
var NOOP_TRACER = new NoopTracer();
/**
* Proxy tracer provided by the proxy tracer provider
*/
var ProxyTracer = function() {
	function ProxyTracer$1(_provider, name$4, version$1, options) {
		this._provider = _provider;
		this.name = name$4;
		this.version = version$1;
		this.options = options;
	}
	ProxyTracer$1.prototype.startSpan = function(name$4, options, context$1) {
		return this._getTracer().startSpan(name$4, options, context$1);
	};
	ProxyTracer$1.prototype.startActiveSpan = function(_name, _options, _context, _fn) {
		var tracer = this._getTracer();
		return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
	};
	/**
	* Try to get a tracer from the proxy tracer provider.
	* If the proxy tracer provider has no delegate, return a noop tracer.
	*/
	ProxyTracer$1.prototype._getTracer = function() {
		if (this._delegate) return this._delegate;
		var tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
		if (!tracer) return NOOP_TRACER;
		this._delegate = tracer;
		return this._delegate;
	};
	return ProxyTracer$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js
/**
* An implementation of the {@link TracerProvider} which returns an impotent
* Tracer for all calls to `getTracer`.
*
* All operations are no-op.
*/
var NoopTracerProvider = function() {
	function NoopTracerProvider$1() {}
	NoopTracerProvider$1.prototype.getTracer = function(_name, _version, _options) {
		return new NoopTracer();
	};
	return NoopTracerProvider$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js
var NOOP_TRACER_PROVIDER = new NoopTracerProvider();
/**
* Tracer provider which provides {@link ProxyTracer}s.
*
* Before a delegate is set, tracers provided are NoOp.
*   When a delegate is set, traces are provided from the delegate.
*   When a delegate is set after tracers have already been provided,
*   all tracers already provided will use the provided delegate implementation.
*/
var ProxyTracerProvider = function() {
	function ProxyTracerProvider$1() {}
	/**
	* Get a {@link ProxyTracer}
	*/
	ProxyTracerProvider$1.prototype.getTracer = function(name$4, version$1, options) {
		var _a$5;
		return (_a$5 = this.getDelegateTracer(name$4, version$1, options)) !== null && _a$5 !== void 0 ? _a$5 : new ProxyTracer(this, name$4, version$1, options);
	};
	ProxyTracerProvider$1.prototype.getDelegate = function() {
		var _a$5;
		return (_a$5 = this._delegate) !== null && _a$5 !== void 0 ? _a$5 : NOOP_TRACER_PROVIDER;
	};
	/**
	* Set the delegate tracer provider
	*/
	ProxyTracerProvider$1.prototype.setDelegate = function(delegate) {
		this._delegate = delegate;
	};
	ProxyTracerProvider$1.prototype.getDelegateTracer = function(name$4, version$1, options) {
		var _a$5;
		return (_a$5 = this._delegate) === null || _a$5 === void 0 ? void 0 : _a$5.getTracer(name$4, version$1, options);
	};
	return ProxyTracerProvider$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace/status.js
/**
* An enumeration of status codes.
*/
var SpanStatusCode;
(function(SpanStatusCode$1) {
	/**
	* The default status.
	*/
	SpanStatusCode$1[SpanStatusCode$1["UNSET"] = 0] = "UNSET";
	/**
	* The operation has been validated by an Application developer or
	* Operator to have completed successfully.
	*/
	SpanStatusCode$1[SpanStatusCode$1["OK"] = 1] = "OK";
	/**
	* The operation contains an error.
	*/
	SpanStatusCode$1[SpanStatusCode$1["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/context-api.js
/** Entrypoint for context API */
var context = ContextAPI.getInstance();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/api/trace.js
var API_NAME = "trace";
/**
* Singleton object which represents the entry point to the OpenTelemetry Tracing API
*/
var TraceAPI = function() {
	/** Empty private constructor prevents end users from constructing a new instance of the API */
	function TraceAPI$1() {
		this._proxyTracerProvider = new ProxyTracerProvider();
		this.wrapSpanContext = wrapSpanContext;
		this.isSpanContextValid = isSpanContextValid;
		this.deleteSpan = deleteSpan;
		this.getSpan = getSpan;
		this.getActiveSpan = getActiveSpan;
		this.getSpanContext = getSpanContext;
		this.setSpan = setSpan;
		this.setSpanContext = setSpanContext;
	}
	/** Get the singleton instance of the Trace API */
	TraceAPI$1.getInstance = function() {
		if (!this._instance) this._instance = new TraceAPI$1();
		return this._instance;
	};
	/**
	* Set the current global tracer.
	*
	* @returns true if the tracer provider was successfully registered, else false
	*/
	TraceAPI$1.prototype.setGlobalTracerProvider = function(provider) {
		var success = registerGlobal(API_NAME, this._proxyTracerProvider, DiagAPI.instance());
		if (success) this._proxyTracerProvider.setDelegate(provider);
		return success;
	};
	/**
	* Returns the global tracer provider.
	*/
	TraceAPI$1.prototype.getTracerProvider = function() {
		return getGlobal(API_NAME) || this._proxyTracerProvider;
	};
	/**
	* Returns a tracer from the global tracer provider.
	*/
	TraceAPI$1.prototype.getTracer = function(name$4, version$1) {
		return this.getTracerProvider().getTracer(name$4, version$1);
	};
	/** Remove the global tracer provider */
	TraceAPI$1.prototype.disable = function() {
		unregisterGlobal(API_NAME, DiagAPI.instance());
		this._proxyTracerProvider = new ProxyTracerProvider();
	};
	return TraceAPI$1;
}();

//#endregion
//#region ../node_modules/@opentelemetry/api/build/esm/trace-api.js
/** Entrypoint for trace API */
var trace = TraceAPI.getInstance();

//#endregion
//#region ../node_modules/ai/dist/index.mjs
var __defProp = Object.defineProperty;
var __export = (target, all) => {
	for (var name20 in all) __defProp(target, name20, {
		get: all[name20],
		enumerable: true
	});
};
var name = "AI_InvalidArgumentError";
var marker = `vercel.ai.error.${name}`;
var symbol = Symbol.for(marker);
var _a;
var InvalidArgumentError = class extends AISDKError {
	constructor({ parameter, value, message }) {
		super({
			name,
			message: `Invalid argument for parameter ${parameter}: ${message}`
		});
		this[_a] = true;
		this.parameter = parameter;
		this.value = value;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker);
	}
};
_a = symbol;
var name2 = "AI_InvalidStreamPartError";
var marker2 = `vercel.ai.error.${name2}`;
var symbol2 = Symbol.for(marker2);
var _a2;
_a2 = symbol2;
var name3 = "AI_InvalidToolApprovalError";
var marker3 = `vercel.ai.error.${name3}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var InvalidToolApprovalError = class extends AISDKError {
	constructor({ approvalId }) {
		super({
			name: name3,
			message: `Tool approval response references unknown approvalId: "${approvalId}". No matching tool-approval-request found in message history.`
		});
		this[_a3] = true;
		this.approvalId = approvalId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3);
	}
};
_a3 = symbol3;
var name4 = "AI_InvalidToolInputError";
var marker4 = `vercel.ai.error.${name4}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var InvalidToolInputError = class extends AISDKError {
	constructor({ toolInput, toolName, cause, message = `Invalid input for tool ${toolName}: ${getErrorMessage$1(cause)}` }) {
		super({
			name: name4,
			message,
			cause
		});
		this[_a4] = true;
		this.toolInput = toolInput;
		this.toolName = toolName;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4);
	}
};
_a4 = symbol4;
var name5 = "AI_ToolCallNotFoundForApprovalError";
var marker5 = `vercel.ai.error.${name5}`;
var symbol5 = Symbol.for(marker5);
var _a5;
var ToolCallNotFoundForApprovalError = class extends AISDKError {
	constructor({ toolCallId, approvalId }) {
		super({
			name: name5,
			message: `Tool call "${toolCallId}" not found for approval request "${approvalId}".`
		});
		this[_a5] = true;
		this.toolCallId = toolCallId;
		this.approvalId = approvalId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker5);
	}
};
_a5 = symbol5;
var name6 = "AI_MissingToolResultsError";
var marker6 = `vercel.ai.error.${name6}`;
var symbol6 = Symbol.for(marker6);
var _a6;
var MissingToolResultsError = class extends AISDKError {
	constructor({ toolCallIds }) {
		super({
			name: name6,
			message: `Tool result${toolCallIds.length > 1 ? "s are" : " is"} missing for tool call${toolCallIds.length > 1 ? "s" : ""} ${toolCallIds.join(", ")}.`
		});
		this[_a6] = true;
		this.toolCallIds = toolCallIds;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker6);
	}
};
_a6 = symbol6;
var name7 = "AI_NoImageGeneratedError";
var marker7 = `vercel.ai.error.${name7}`;
var symbol7 = Symbol.for(marker7);
var _a7;
_a7 = symbol7;
var name8 = "AI_NoObjectGeneratedError";
var marker8 = `vercel.ai.error.${name8}`;
var symbol8 = Symbol.for(marker8);
var _a8;
var NoObjectGeneratedError = class extends AISDKError {
	constructor({ message = "No object generated.", cause, text: text2, response, usage, finishReason }) {
		super({
			name: name8,
			message,
			cause
		});
		this[_a8] = true;
		this.text = text2;
		this.response = response;
		this.usage = usage;
		this.finishReason = finishReason;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker8);
	}
};
_a8 = symbol8;
var name9 = "AI_NoOutputGeneratedError";
var marker9 = `vercel.ai.error.${name9}`;
var symbol9 = Symbol.for(marker9);
var _a9;
var NoOutputGeneratedError = class extends AISDKError {
	constructor({ message = "No output generated.", cause } = {}) {
		super({
			name: name9,
			message,
			cause
		});
		this[_a9] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker9);
	}
};
_a9 = symbol9;
var name10 = "AI_NoSpeechGeneratedError";
var marker10 = `vercel.ai.error.${name10}`;
var symbol10 = Symbol.for(marker10);
var _a10;
_a10 = symbol10;
var name11 = "AI_NoTranscriptGeneratedError";
var marker11 = `vercel.ai.error.${name11}`;
var symbol11 = Symbol.for(marker11);
var _a11;
_a11 = symbol11;
var name12 = "AI_NoSuchToolError";
var marker12 = `vercel.ai.error.${name12}`;
var symbol12 = Symbol.for(marker12);
var _a12;
var NoSuchToolError = class extends AISDKError {
	constructor({ toolName, availableTools = void 0, message = `Model tried to call unavailable tool '${toolName}'. ${availableTools === void 0 ? "No tools are available." : `Available tools: ${availableTools.join(", ")}.`}` }) {
		super({
			name: name12,
			message
		});
		this[_a12] = true;
		this.toolName = toolName;
		this.availableTools = availableTools;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker12);
	}
};
_a12 = symbol12;
var name13 = "AI_ToolCallRepairError";
var marker13 = `vercel.ai.error.${name13}`;
var symbol13 = Symbol.for(marker13);
var _a13;
var ToolCallRepairError = class extends AISDKError {
	constructor({ cause, originalError, message = `Error repairing tool call: ${getErrorMessage$1(cause)}` }) {
		super({
			name: name13,
			message,
			cause
		});
		this[_a13] = true;
		this.originalError = originalError;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker13);
	}
};
_a13 = symbol13;
var UnsupportedModelVersionError = class extends AISDKError {
	constructor(options) {
		super({
			name: "AI_UnsupportedModelVersionError",
			message: `Unsupported model version ${options.version} for provider "${options.provider}" and model "${options.modelId}". AI SDK 5 only supports models that implement specification version "v2".`
		});
		this.version = options.version;
		this.provider = options.provider;
		this.modelId = options.modelId;
	}
};
var name14 = "AI_UIMessageStreamError";
var marker14 = `vercel.ai.error.${name14}`;
var symbol14 = Symbol.for(marker14);
var _a14;
var UIMessageStreamError = class extends AISDKError {
	constructor({ chunkType, chunkId, message }) {
		super({
			name: name14,
			message
		});
		this[_a14] = true;
		this.chunkType = chunkType;
		this.chunkId = chunkId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker14);
	}
};
_a14 = symbol14;
var name15 = "AI_InvalidDataContentError";
var marker15 = `vercel.ai.error.${name15}`;
var symbol15 = Symbol.for(marker15);
var _a15;
_a15 = symbol15;
var name16 = "AI_InvalidMessageRoleError";
var marker16 = `vercel.ai.error.${name16}`;
var symbol16 = Symbol.for(marker16);
var _a16;
var InvalidMessageRoleError = class extends AISDKError {
	constructor({ role, message = `Invalid message role: '${role}'. Must be one of: "system", "user", "assistant", "tool".` }) {
		super({
			name: name16,
			message
		});
		this[_a16] = true;
		this.role = role;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker16);
	}
};
_a16 = symbol16;
var name17 = "AI_MessageConversionError";
var marker17 = `vercel.ai.error.${name17}`;
var symbol17 = Symbol.for(marker17);
var _a17;
var MessageConversionError = class extends AISDKError {
	constructor({ originalMessage, message }) {
		super({
			name: name17,
			message
		});
		this[_a17] = true;
		this.originalMessage = originalMessage;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker17);
	}
};
_a17 = symbol17;
var name18 = "AI_RetryError";
var marker18 = `vercel.ai.error.${name18}`;
var symbol18 = Symbol.for(marker18);
var _a18;
var RetryError = class extends AISDKError {
	constructor({ message, reason, errors }) {
		super({
			name: name18,
			message
		});
		this[_a18] = true;
		this.reason = reason;
		this.errors = errors;
		this.lastError = errors[errors.length - 1];
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker18);
	}
};
_a18 = symbol18;
function formatWarning({ warning, provider, model }) {
	const prefix = `AI SDK Warning (${provider} / ${model}):`;
	switch (warning.type) {
		case "unsupported": {
			let message = `${prefix} The feature "${warning.feature}" is not supported.`;
			if (warning.details) message += ` ${warning.details}`;
			return message;
		}
		case "compatibility": {
			let message = `${prefix} The feature "${warning.feature}" is used in a compatibility mode.`;
			if (warning.details) message += ` ${warning.details}`;
			return message;
		}
		case "other": return `${prefix} ${warning.message}`;
		default: return `${prefix} ${JSON.stringify(warning, null, 2)}`;
	}
}
var FIRST_WARNING_INFO_MESSAGE = "AI SDK Warning System: To turn off warning logging, set the AI_SDK_LOG_WARNINGS global to false.";
var hasLoggedBefore = false;
var logWarnings = (options) => {
	if (options.warnings.length === 0) return;
	const logger = globalThis.AI_SDK_LOG_WARNINGS;
	if (logger === false) return;
	if (typeof logger === "function") {
		logger(options);
		return;
	}
	if (!hasLoggedBefore) {
		hasLoggedBefore = true;
		console.info(FIRST_WARNING_INFO_MESSAGE);
	}
	for (const warning of options.warnings) console.warn(formatWarning({
		warning,
		provider: options.provider,
		model: options.model
	}));
};
function logV2CompatibilityWarning({ provider, modelId }) {
	logWarnings({
		warnings: [{
			type: "compatibility",
			feature: "specificationVersion",
			details: `Using v2 specification compatibility mode. Some features may not be available.`
		}],
		provider,
		model: modelId
	});
}
function asLanguageModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		switch (prop) {
			case "specificationVersion": return "v3";
			case "doGenerate": return async (...args) => {
				const result = await target.doGenerate(...args);
				return {
					...result,
					finishReason: convertV2FinishReasonToV3(result.finishReason),
					usage: convertV2UsageToV3(result.usage)
				};
			};
			case "doStream": return async (...args) => {
				const result = await target.doStream(...args);
				return {
					...result,
					stream: convertV2StreamToV3(result.stream)
				};
			};
			default: return target[prop];
		}
	} });
}
function convertV2StreamToV3(stream) {
	return stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		switch (chunk.type) {
			case "finish":
				controller.enqueue({
					...chunk,
					finishReason: convertV2FinishReasonToV3(chunk.finishReason),
					usage: convertV2UsageToV3(chunk.usage)
				});
				break;
			default:
				controller.enqueue(chunk);
				break;
		}
	} }));
}
function convertV2FinishReasonToV3(finishReason) {
	return {
		unified: finishReason === "unknown" ? "other" : finishReason,
		raw: void 0
	};
}
function convertV2UsageToV3(usage) {
	return {
		inputTokens: {
			total: usage.inputTokens,
			noCache: void 0,
			cacheRead: usage.cachedInputTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: usage.outputTokens,
			text: void 0,
			reasoning: usage.reasoningTokens
		}
	};
}
function resolveLanguageModel(model) {
	if (typeof model !== "string") {
		if (model.specificationVersion !== "v3" && model.specificationVersion !== "v2") {
			const unsupportedModel = model;
			throw new UnsupportedModelVersionError({
				version: unsupportedModel.specificationVersion,
				provider: unsupportedModel.provider,
				modelId: unsupportedModel.modelId
			});
		}
		return asLanguageModelV3(model);
	}
	return getGlobalProvider().languageModel(model);
}
function getGlobalProvider() {
	var _a20;
	return (_a20 = globalThis.AI_SDK_DEFAULT_PROVIDER) != null ? _a20 : gateway;
}
function getTotalTimeoutMs(timeout) {
	if (timeout == null) return;
	if (typeof timeout === "number") return timeout;
	return timeout.totalMs;
}
function getStepTimeoutMs(timeout) {
	if (timeout == null || typeof timeout === "number") return;
	return timeout.stepMs;
}
function getChunkTimeoutMs(timeout) {
	if (timeout == null || typeof timeout === "number") return;
	return timeout.chunkMs;
}
var imageMediaTypeSignatures = [
	{
		mediaType: "image/gif",
		bytesPrefix: [
			71,
			73,
			70
		]
	},
	{
		mediaType: "image/png",
		bytesPrefix: [
			137,
			80,
			78,
			71
		]
	},
	{
		mediaType: "image/jpeg",
		bytesPrefix: [255, 216]
	},
	{
		mediaType: "image/webp",
		bytesPrefix: [
			82,
			73,
			70,
			70,
			null,
			null,
			null,
			null,
			87,
			69,
			66,
			80
		]
	},
	{
		mediaType: "image/bmp",
		bytesPrefix: [66, 77]
	},
	{
		mediaType: "image/tiff",
		bytesPrefix: [
			73,
			73,
			42,
			0
		]
	},
	{
		mediaType: "image/tiff",
		bytesPrefix: [
			77,
			77,
			0,
			42
		]
	},
	{
		mediaType: "image/avif",
		bytesPrefix: [
			0,
			0,
			0,
			32,
			102,
			116,
			121,
			112,
			97,
			118,
			105,
			102
		]
	},
	{
		mediaType: "image/heic",
		bytesPrefix: [
			0,
			0,
			0,
			32,
			102,
			116,
			121,
			112,
			104,
			101,
			105,
			99
		]
	}
];
var stripID3 = (data) => {
	const bytes = typeof data === "string" ? convertBase64ToUint8Array(data) : data;
	const id3Size = (bytes[6] & 127) << 21 | (bytes[7] & 127) << 14 | (bytes[8] & 127) << 7 | bytes[9] & 127;
	return bytes.slice(id3Size + 10);
};
function stripID3TagsIfPresent(data) {
	return typeof data === "string" && data.startsWith("SUQz") || typeof data !== "string" && data.length > 10 && data[0] === 73 && data[1] === 68 && data[2] === 51 ? stripID3(data) : data;
}
function detectMediaType({ data, signatures }) {
	const processedData = stripID3TagsIfPresent(data);
	const bytes = typeof processedData === "string" ? convertBase64ToUint8Array(processedData.substring(0, Math.min(processedData.length, 24))) : processedData;
	for (const signature of signatures) if (bytes.length >= signature.bytesPrefix.length && signature.bytesPrefix.every((byte, index) => byte === null || bytes[index] === byte)) return signature.mediaType;
}
var VERSION = "6.0.62";
var download = async ({ url }) => {
	var _a20;
	const urlText = url.toString();
	try {
		const response = await fetch(urlText, { headers: withUserAgentSuffix({}, `ai-sdk/${VERSION}`, getRuntimeEnvironmentUserAgent()) });
		if (!response.ok) throw new DownloadError({
			url: urlText,
			statusCode: response.status,
			statusText: response.statusText
		});
		return {
			data: new Uint8Array(await response.arrayBuffer()),
			mediaType: (_a20 = response.headers.get("content-type")) != null ? _a20 : void 0
		};
	} catch (error) {
		if (DownloadError.isInstance(error)) throw error;
		throw new DownloadError({
			url: urlText,
			cause: error
		});
	}
};
var createDefaultDownloadFunction = (download2 = download) => (requestedDownloads) => Promise.all(requestedDownloads.map(async (requestedDownload) => requestedDownload.isUrlSupportedByModel ? null : download2(requestedDownload)));
function splitDataUrl(dataUrl) {
	try {
		const [header, base64Content] = dataUrl.split(",");
		return {
			mediaType: header.split(";")[0].split(":")[1],
			base64Content
		};
	} catch (error) {
		return {
			mediaType: void 0,
			base64Content: void 0
		};
	}
}
var dataContentSchema = union([
	string(),
	_instanceof(Uint8Array),
	_instanceof(ArrayBuffer),
	custom((value) => {
		var _a20, _b$3;
		return (_b$3 = (_a20 = globalThis.Buffer) == null ? void 0 : _a20.isBuffer(value)) != null ? _b$3 : false;
	}, { message: "Must be a Buffer" })
]);
function convertToLanguageModelV3DataContent(content) {
	if (content instanceof Uint8Array) return {
		data: content,
		mediaType: void 0
	};
	if (content instanceof ArrayBuffer) return {
		data: new Uint8Array(content),
		mediaType: void 0
	};
	if (typeof content === "string") try {
		content = new URL(content);
	} catch (error) {}
	if (content instanceof URL && content.protocol === "data:") {
		const { mediaType: dataUrlMediaType, base64Content } = splitDataUrl(content.toString());
		if (dataUrlMediaType == null || base64Content == null) throw new AISDKError({
			name: "InvalidDataContentError",
			message: `Invalid data URL format in content ${content.toString()}`
		});
		return {
			data: base64Content,
			mediaType: dataUrlMediaType
		};
	}
	return {
		data: content,
		mediaType: void 0
	};
}
function convertDataContentToBase64String(content) {
	if (typeof content === "string") return content;
	if (content instanceof ArrayBuffer) return convertUint8ArrayToBase64(new Uint8Array(content));
	return convertUint8ArrayToBase64(content);
}
function asArray(value) {
	return value === void 0 ? [] : Array.isArray(value) ? value : [value];
}
async function convertToLanguageModelPrompt({ prompt, supportedUrls, download: download2 = createDefaultDownloadFunction() }) {
	const downloadedAssets = await downloadAssets(prompt.messages, download2, supportedUrls);
	const approvalIdToToolCallId = /* @__PURE__ */ new Map();
	for (const message of prompt.messages) if (message.role === "assistant" && Array.isArray(message.content)) {
		for (const part of message.content) if (part.type === "tool-approval-request" && "approvalId" in part && "toolCallId" in part) approvalIdToToolCallId.set(part.approvalId, part.toolCallId);
	}
	const approvedToolCallIds = /* @__PURE__ */ new Set();
	for (const message of prompt.messages) if (message.role === "tool") {
		for (const part of message.content) if (part.type === "tool-approval-response") {
			const toolCallId = approvalIdToToolCallId.get(part.approvalId);
			if (toolCallId) approvedToolCallIds.add(toolCallId);
		}
	}
	const messages = [...prompt.system != null ? typeof prompt.system === "string" ? [{
		role: "system",
		content: prompt.system
	}] : asArray(prompt.system).map((message) => ({
		role: "system",
		content: message.content,
		providerOptions: message.providerOptions
	})) : [], ...prompt.messages.map((message) => convertToLanguageModelMessage({
		message,
		downloadedAssets
	}))];
	const combinedMessages = [];
	for (const message of messages) {
		if (message.role !== "tool") {
			combinedMessages.push(message);
			continue;
		}
		const lastCombinedMessage = combinedMessages.at(-1);
		if ((lastCombinedMessage == null ? void 0 : lastCombinedMessage.role) === "tool") lastCombinedMessage.content.push(...message.content);
		else combinedMessages.push(message);
	}
	const toolCallIds = /* @__PURE__ */ new Set();
	for (const message of combinedMessages) switch (message.role) {
		case "assistant":
			for (const content of message.content) if (content.type === "tool-call" && !content.providerExecuted) toolCallIds.add(content.toolCallId);
			break;
		case "tool":
			for (const content of message.content) if (content.type === "tool-result") toolCallIds.delete(content.toolCallId);
			break;
		case "user":
		case "system":
			for (const id of approvedToolCallIds) toolCallIds.delete(id);
			if (toolCallIds.size > 0) throw new MissingToolResultsError({ toolCallIds: Array.from(toolCallIds) });
			break;
	}
	for (const id of approvedToolCallIds) toolCallIds.delete(id);
	if (toolCallIds.size > 0) throw new MissingToolResultsError({ toolCallIds: Array.from(toolCallIds) });
	return combinedMessages.filter((message) => message.role !== "tool" || message.content.length > 0);
}
function convertToLanguageModelMessage({ message, downloadedAssets }) {
	const role = message.role;
	switch (role) {
		case "system": return {
			role: "system",
			content: message.content,
			providerOptions: message.providerOptions
		};
		case "user":
			if (typeof message.content === "string") return {
				role: "user",
				content: [{
					type: "text",
					text: message.content
				}],
				providerOptions: message.providerOptions
			};
			return {
				role: "user",
				content: message.content.map((part) => convertPartToLanguageModelPart(part, downloadedAssets)).filter((part) => part.type !== "text" || part.text !== ""),
				providerOptions: message.providerOptions
			};
		case "assistant":
			if (typeof message.content === "string") return {
				role: "assistant",
				content: [{
					type: "text",
					text: message.content
				}],
				providerOptions: message.providerOptions
			};
			return {
				role: "assistant",
				content: message.content.filter((part) => part.type !== "text" || part.text !== "" || part.providerOptions != null).filter((part) => part.type !== "tool-approval-request").map((part) => {
					const providerOptions = part.providerOptions;
					switch (part.type) {
						case "file": {
							const { data, mediaType } = convertToLanguageModelV3DataContent(part.data);
							return {
								type: "file",
								data,
								filename: part.filename,
								mediaType: mediaType != null ? mediaType : part.mediaType,
								providerOptions
							};
						}
						case "reasoning": return {
							type: "reasoning",
							text: part.text,
							providerOptions
						};
						case "text": return {
							type: "text",
							text: part.text,
							providerOptions
						};
						case "tool-call": return {
							type: "tool-call",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							input: part.input,
							providerExecuted: part.providerExecuted,
							providerOptions
						};
						case "tool-result": return {
							type: "tool-result",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							output: mapToolResultOutput(part.output),
							providerOptions
						};
					}
				}),
				providerOptions: message.providerOptions
			};
		case "tool": return {
			role: "tool",
			content: message.content.filter((part) => part.type !== "tool-approval-response" || part.providerExecuted).map((part) => {
				switch (part.type) {
					case "tool-result": return {
						type: "tool-result",
						toolCallId: part.toolCallId,
						toolName: part.toolName,
						output: mapToolResultOutput(part.output),
						providerOptions: part.providerOptions
					};
					case "tool-approval-response": return {
						type: "tool-approval-response",
						approvalId: part.approvalId,
						approved: part.approved,
						reason: part.reason
					};
				}
			}),
			providerOptions: message.providerOptions
		};
		default: throw new InvalidMessageRoleError({ role });
	}
}
async function downloadAssets(messages, download2, supportedUrls) {
	const plannedDownloads = messages.filter((message) => message.role === "user").map((message) => message.content).filter((content) => Array.isArray(content)).flat().filter((part) => part.type === "image" || part.type === "file").map((part) => {
		var _a20;
		const mediaType = (_a20 = part.mediaType) != null ? _a20 : part.type === "image" ? "image/*" : void 0;
		let data = part.type === "image" ? part.image : part.data;
		if (typeof data === "string") try {
			data = new URL(data);
		} catch (ignored) {}
		return {
			mediaType,
			data
		};
	}).filter((part) => part.data instanceof URL).map((part) => ({
		url: part.data,
		isUrlSupportedByModel: part.mediaType != null && isUrlSupported({
			url: part.data.toString(),
			mediaType: part.mediaType,
			supportedUrls
		})
	}));
	const downloadedFiles = await download2(plannedDownloads);
	return Object.fromEntries(downloadedFiles.map((file, index) => file == null ? null : [plannedDownloads[index].url.toString(), {
		data: file.data,
		mediaType: file.mediaType
	}]).filter((file) => file != null));
}
function convertPartToLanguageModelPart(part, downloadedAssets) {
	var _a20;
	if (part.type === "text") return {
		type: "text",
		text: part.text,
		providerOptions: part.providerOptions
	};
	let originalData;
	const type = part.type;
	switch (type) {
		case "image":
			originalData = part.image;
			break;
		case "file":
			originalData = part.data;
			break;
		default: throw new Error(`Unsupported part type: ${type}`);
	}
	const { data: convertedData, mediaType: convertedMediaType } = convertToLanguageModelV3DataContent(originalData);
	let mediaType = convertedMediaType != null ? convertedMediaType : part.mediaType;
	let data = convertedData;
	if (data instanceof URL) {
		const downloadedFile = downloadedAssets[data.toString()];
		if (downloadedFile) {
			data = downloadedFile.data;
			mediaType ??= downloadedFile.mediaType;
		}
	}
	switch (type) {
		case "image":
			if (data instanceof Uint8Array || typeof data === "string") mediaType = (_a20 = detectMediaType({
				data,
				signatures: imageMediaTypeSignatures
			})) != null ? _a20 : mediaType;
			return {
				type: "file",
				mediaType: mediaType != null ? mediaType : "image/*",
				filename: void 0,
				data,
				providerOptions: part.providerOptions
			};
		case "file":
			if (mediaType == null) throw new Error(`Media type is missing for file part`);
			return {
				type: "file",
				mediaType,
				filename: part.filename,
				data,
				providerOptions: part.providerOptions
			};
	}
}
function mapToolResultOutput(output) {
	if (output.type !== "content") return output;
	return {
		type: "content",
		value: output.value.map((item) => {
			if (item.type !== "media") return item;
			if (item.mediaType.startsWith("image/")) return {
				type: "image-data",
				data: item.data,
				mediaType: item.mediaType
			};
			return {
				type: "file-data",
				data: item.data,
				mediaType: item.mediaType
			};
		})
	};
}
async function createToolModelOutput({ toolCallId, input, output, tool: tool2, errorMode }) {
	if (errorMode === "text") return {
		type: "error-text",
		value: getErrorMessage$1(output)
	};
	else if (errorMode === "json") return {
		type: "error-json",
		value: toJSONValue(output)
	};
	if (tool2 == null ? void 0 : tool2.toModelOutput) return await tool2.toModelOutput({
		toolCallId,
		input,
		output
	});
	return typeof output === "string" ? {
		type: "text",
		value: output
	} : {
		type: "json",
		value: toJSONValue(output)
	};
}
function toJSONValue(value) {
	return value === void 0 ? null : value;
}
function prepareCallSettings({ maxOutputTokens, temperature, topP, topK, presencePenalty, frequencyPenalty, seed, stopSequences }) {
	if (maxOutputTokens != null) {
		if (!Number.isInteger(maxOutputTokens)) throw new InvalidArgumentError({
			parameter: "maxOutputTokens",
			value: maxOutputTokens,
			message: "maxOutputTokens must be an integer"
		});
		if (maxOutputTokens < 1) throw new InvalidArgumentError({
			parameter: "maxOutputTokens",
			value: maxOutputTokens,
			message: "maxOutputTokens must be >= 1"
		});
	}
	if (temperature != null) {
		if (typeof temperature !== "number") throw new InvalidArgumentError({
			parameter: "temperature",
			value: temperature,
			message: "temperature must be a number"
		});
	}
	if (topP != null) {
		if (typeof topP !== "number") throw new InvalidArgumentError({
			parameter: "topP",
			value: topP,
			message: "topP must be a number"
		});
	}
	if (topK != null) {
		if (typeof topK !== "number") throw new InvalidArgumentError({
			parameter: "topK",
			value: topK,
			message: "topK must be a number"
		});
	}
	if (presencePenalty != null) {
		if (typeof presencePenalty !== "number") throw new InvalidArgumentError({
			parameter: "presencePenalty",
			value: presencePenalty,
			message: "presencePenalty must be a number"
		});
	}
	if (frequencyPenalty != null) {
		if (typeof frequencyPenalty !== "number") throw new InvalidArgumentError({
			parameter: "frequencyPenalty",
			value: frequencyPenalty,
			message: "frequencyPenalty must be a number"
		});
	}
	if (seed != null) {
		if (!Number.isInteger(seed)) throw new InvalidArgumentError({
			parameter: "seed",
			value: seed,
			message: "seed must be an integer"
		});
	}
	return {
		maxOutputTokens,
		temperature,
		topP,
		topK,
		presencePenalty,
		frequencyPenalty,
		stopSequences,
		seed
	};
}
function isNonEmptyObject(object2) {
	return object2 != null && Object.keys(object2).length > 0;
}
async function prepareToolsAndToolChoice({ tools, toolChoice, activeTools }) {
	if (!isNonEmptyObject(tools)) return {
		tools: void 0,
		toolChoice: void 0
	};
	const filteredTools = activeTools != null ? Object.entries(tools).filter(([name20]) => activeTools.includes(name20)) : Object.entries(tools);
	const languageModelTools = [];
	for (const [name20, tool2] of filteredTools) {
		const toolType = tool2.type;
		switch (toolType) {
			case void 0:
			case "dynamic":
			case "function":
				languageModelTools.push({
					type: "function",
					name: name20,
					description: tool2.description,
					inputSchema: await asSchema(tool2.inputSchema).jsonSchema,
					...tool2.inputExamples != null ? { inputExamples: tool2.inputExamples } : {},
					providerOptions: tool2.providerOptions,
					...tool2.strict != null ? { strict: tool2.strict } : {}
				});
				break;
			case "provider":
				languageModelTools.push({
					type: "provider",
					name: name20,
					id: tool2.id,
					args: tool2.args
				});
				break;
			default: {
				const exhaustiveCheck = toolType;
				throw new Error(`Unsupported tool type: ${exhaustiveCheck}`);
			}
		}
	}
	return {
		tools: languageModelTools,
		toolChoice: toolChoice == null ? { type: "auto" } : typeof toolChoice === "string" ? { type: toolChoice } : {
			type: "tool",
			toolName: toolChoice.toolName
		}
	};
}
var jsonValueSchema = lazy(() => union([
	_null(),
	string(),
	number(),
	boolean(),
	record(string(), jsonValueSchema.optional()),
	array$1(jsonValueSchema)
]));
var providerMetadataSchema = record(string(), record(string(), jsonValueSchema.optional()));
var textPartSchema = object$1({
	type: literal("text"),
	text: string(),
	providerOptions: providerMetadataSchema.optional()
});
var imagePartSchema = object$1({
	type: literal("image"),
	image: union([dataContentSchema, _instanceof(URL)]),
	mediaType: string().optional(),
	providerOptions: providerMetadataSchema.optional()
});
var filePartSchema = object$1({
	type: literal("file"),
	data: union([dataContentSchema, _instanceof(URL)]),
	filename: string().optional(),
	mediaType: string(),
	providerOptions: providerMetadataSchema.optional()
});
var reasoningPartSchema = object$1({
	type: literal("reasoning"),
	text: string(),
	providerOptions: providerMetadataSchema.optional()
});
var toolCallPartSchema = object$1({
	type: literal("tool-call"),
	toolCallId: string(),
	toolName: string(),
	input: unknown(),
	providerOptions: providerMetadataSchema.optional(),
	providerExecuted: boolean().optional()
});
var outputSchema = discriminatedUnion("type", [
	object$1({
		type: literal("text"),
		value: string(),
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("json"),
		value: jsonValueSchema,
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("execution-denied"),
		reason: string().optional(),
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("error-text"),
		value: string(),
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("error-json"),
		value: jsonValueSchema,
		providerOptions: providerMetadataSchema.optional()
	}),
	object$1({
		type: literal("content"),
		value: array$1(union([
			object$1({
				type: literal("text"),
				text: string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("media"),
				data: string(),
				mediaType: string()
			}),
			object$1({
				type: literal("file-data"),
				data: string(),
				mediaType: string(),
				filename: string().optional(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("file-url"),
				url: string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("file-id"),
				fileId: union([string(), record(string(), string())]),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("image-data"),
				data: string(),
				mediaType: string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("image-url"),
				url: string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("image-file-id"),
				fileId: union([string(), record(string(), string())]),
				providerOptions: providerMetadataSchema.optional()
			}),
			object$1({
				type: literal("custom"),
				providerOptions: providerMetadataSchema.optional()
			})
		]))
	})
]);
var toolResultPartSchema = object$1({
	type: literal("tool-result"),
	toolCallId: string(),
	toolName: string(),
	output: outputSchema,
	providerOptions: providerMetadataSchema.optional()
});
var toolApprovalRequestSchema = object$1({
	type: literal("tool-approval-request"),
	approvalId: string(),
	toolCallId: string()
});
var toolApprovalResponseSchema = object$1({
	type: literal("tool-approval-response"),
	approvalId: string(),
	approved: boolean(),
	reason: string().optional()
});
var systemModelMessageSchema = object$1({
	role: literal("system"),
	content: string(),
	providerOptions: providerMetadataSchema.optional()
});
var userModelMessageSchema = object$1({
	role: literal("user"),
	content: union([string(), array$1(union([
		textPartSchema,
		imagePartSchema,
		filePartSchema
	]))]),
	providerOptions: providerMetadataSchema.optional()
});
var assistantModelMessageSchema = object$1({
	role: literal("assistant"),
	content: union([string(), array$1(union([
		textPartSchema,
		filePartSchema,
		reasoningPartSchema,
		toolCallPartSchema,
		toolResultPartSchema,
		toolApprovalRequestSchema
	]))]),
	providerOptions: providerMetadataSchema.optional()
});
var toolModelMessageSchema = object$1({
	role: literal("tool"),
	content: array$1(union([toolResultPartSchema, toolApprovalResponseSchema])),
	providerOptions: providerMetadataSchema.optional()
});
var modelMessageSchema = union([
	systemModelMessageSchema,
	userModelMessageSchema,
	assistantModelMessageSchema,
	toolModelMessageSchema
]);
async function standardizePrompt(prompt) {
	if (prompt.prompt == null && prompt.messages == null) throw new InvalidPromptError({
		prompt,
		message: "prompt or messages must be defined"
	});
	if (prompt.prompt != null && prompt.messages != null) throw new InvalidPromptError({
		prompt,
		message: "prompt and messages cannot be defined at the same time"
	});
	if (prompt.system != null && typeof prompt.system !== "string" && !asArray(prompt.system).every((message) => typeof message === "object" && message !== null && "role" in message && message.role === "system")) throw new InvalidPromptError({
		prompt,
		message: "system must be a string, SystemModelMessage, or array of SystemModelMessage"
	});
	let messages;
	if (prompt.prompt != null && typeof prompt.prompt === "string") messages = [{
		role: "user",
		content: prompt.prompt
	}];
	else if (prompt.prompt != null && Array.isArray(prompt.prompt)) messages = prompt.prompt;
	else if (prompt.messages != null) messages = prompt.messages;
	else throw new InvalidPromptError({
		prompt,
		message: "prompt or messages must be defined"
	});
	if (messages.length === 0) throw new InvalidPromptError({
		prompt,
		message: "messages must not be empty"
	});
	const validationResult = await safeValidateTypes({
		value: messages,
		schema: array$1(modelMessageSchema)
	});
	if (!validationResult.success) throw new InvalidPromptError({
		prompt,
		message: "The messages do not match the ModelMessage[] schema.",
		cause: validationResult.error
	});
	return {
		messages,
		system: prompt.system
	};
}
function wrapGatewayError(error) {
	if (!GatewayAuthenticationError.isInstance(error)) return error;
	const isProductionEnv = (process == null ? void 0 : process.env.NODE_ENV) === "production";
	const moreInfoURL = "https://ai-sdk.dev/unauthenticated-ai-gateway";
	if (isProductionEnv) return new AISDKError({
		name: "GatewayError",
		message: `Unauthenticated. Configure AI_GATEWAY_API_KEY or use a provider module. Learn more: ${moreInfoURL}`
	});
	return Object.assign(/* @__PURE__ */ new Error(`\x1B[1m\x1B[31mUnauthenticated request to AI Gateway.\x1B[0m

To authenticate, set the \x1B[33mAI_GATEWAY_API_KEY\x1B[0m environment variable with your API key.

Alternatively, you can use a provider module instead of the AI Gateway.

Learn more: \x1B[34m${moreInfoURL}\x1B[0m

`), { name: "GatewayAuthenticationError" });
}
function assembleOperationName({ operationId, telemetry }) {
	return {
		"operation.name": `${operationId}${(telemetry == null ? void 0 : telemetry.functionId) != null ? ` ${telemetry.functionId}` : ""}`,
		"resource.name": telemetry == null ? void 0 : telemetry.functionId,
		"ai.operationId": operationId,
		"ai.telemetry.functionId": telemetry == null ? void 0 : telemetry.functionId
	};
}
function getBaseTelemetryAttributes({ model, settings, telemetry, headers }) {
	var _a20;
	return {
		"ai.model.provider": model.provider,
		"ai.model.id": model.modelId,
		...Object.entries(settings).reduce((attributes, [key, value]) => {
			if (key === "timeout") {
				const totalTimeoutMs = getTotalTimeoutMs(value);
				if (totalTimeoutMs != null) attributes[`ai.settings.${key}`] = totalTimeoutMs;
			} else attributes[`ai.settings.${key}`] = value;
			return attributes;
		}, {}),
		...Object.entries((_a20 = telemetry == null ? void 0 : telemetry.metadata) != null ? _a20 : {}).reduce((attributes, [key, value]) => {
			attributes[`ai.telemetry.metadata.${key}`] = value;
			return attributes;
		}, {}),
		...Object.entries(headers != null ? headers : {}).reduce((attributes, [key, value]) => {
			if (value !== void 0) attributes[`ai.request.headers.${key}`] = value;
			return attributes;
		}, {})
	};
}
var noopTracer = {
	startSpan() {
		return noopSpan;
	},
	startActiveSpan(name20, arg1, arg2, arg3) {
		if (typeof arg1 === "function") return arg1(noopSpan);
		if (typeof arg2 === "function") return arg2(noopSpan);
		if (typeof arg3 === "function") return arg3(noopSpan);
	}
};
var noopSpan = {
	spanContext() {
		return noopSpanContext;
	},
	setAttribute() {
		return this;
	},
	setAttributes() {
		return this;
	},
	addEvent() {
		return this;
	},
	addLink() {
		return this;
	},
	addLinks() {
		return this;
	},
	setStatus() {
		return this;
	},
	updateName() {
		return this;
	},
	end() {
		return this;
	},
	isRecording() {
		return false;
	},
	recordException() {
		return this;
	}
};
var noopSpanContext = {
	traceId: "",
	spanId: "",
	traceFlags: 0
};
function getTracer({ isEnabled = false, tracer } = {}) {
	if (!isEnabled) return noopTracer;
	if (tracer) return tracer;
	return trace.getTracer("ai");
}
async function recordSpan({ name: name20, tracer, attributes, fn, endWhenDone = true }) {
	return tracer.startActiveSpan(name20, { attributes: await attributes }, async (span) => {
		const ctx = context.active();
		try {
			const result = await context.with(ctx, () => fn(span));
			if (endWhenDone) span.end();
			return result;
		} catch (error) {
			try {
				recordErrorOnSpan(span, error);
			} finally {
				span.end();
			}
			throw error;
		}
	});
}
function recordErrorOnSpan(span, error) {
	if (error instanceof Error) {
		span.recordException({
			name: error.name,
			message: error.message,
			stack: error.stack
		});
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: error.message
		});
	} else span.setStatus({ code: SpanStatusCode.ERROR });
}
async function selectTelemetryAttributes({ telemetry, attributes }) {
	if ((telemetry == null ? void 0 : telemetry.isEnabled) !== true) return {};
	const resultAttributes = {};
	for (const [key, value] of Object.entries(attributes)) {
		if (value == null) continue;
		if (typeof value === "object" && "input" in value && typeof value.input === "function") {
			if ((telemetry == null ? void 0 : telemetry.recordInputs) === false) continue;
			const result = await value.input();
			if (result != null) resultAttributes[key] = result;
			continue;
		}
		if (typeof value === "object" && "output" in value && typeof value.output === "function") {
			if ((telemetry == null ? void 0 : telemetry.recordOutputs) === false) continue;
			const result = await value.output();
			if (result != null) resultAttributes[key] = result;
			continue;
		}
		resultAttributes[key] = value;
	}
	return resultAttributes;
}
function stringifyForTelemetry(prompt) {
	return JSON.stringify(prompt.map((message) => ({
		...message,
		content: typeof message.content === "string" ? message.content : message.content.map((part) => part.type === "file" ? {
			...part,
			data: part.data instanceof Uint8Array ? convertDataContentToBase64String(part.data) : part.data
		} : part)
	})));
}
function asLanguageModelUsage(usage) {
	return {
		inputTokens: usage.inputTokens.total,
		inputTokenDetails: {
			noCacheTokens: usage.inputTokens.noCache,
			cacheReadTokens: usage.inputTokens.cacheRead,
			cacheWriteTokens: usage.inputTokens.cacheWrite
		},
		outputTokens: usage.outputTokens.total,
		outputTokenDetails: {
			textTokens: usage.outputTokens.text,
			reasoningTokens: usage.outputTokens.reasoning
		},
		totalTokens: addTokenCounts(usage.inputTokens.total, usage.outputTokens.total),
		raw: usage.raw,
		reasoningTokens: usage.outputTokens.reasoning,
		cachedInputTokens: usage.inputTokens.cacheRead
	};
}
function createNullLanguageModelUsage() {
	return {
		inputTokens: void 0,
		inputTokenDetails: {
			noCacheTokens: void 0,
			cacheReadTokens: void 0,
			cacheWriteTokens: void 0
		},
		outputTokens: void 0,
		outputTokenDetails: {
			textTokens: void 0,
			reasoningTokens: void 0
		},
		totalTokens: void 0,
		raw: void 0
	};
}
function addLanguageModelUsage(usage1, usage2) {
	var _a20, _b$3, _c, _d, _e, _f, _g, _h, _i, _j;
	return {
		inputTokens: addTokenCounts(usage1.inputTokens, usage2.inputTokens),
		inputTokenDetails: {
			noCacheTokens: addTokenCounts((_a20 = usage1.inputTokenDetails) == null ? void 0 : _a20.noCacheTokens, (_b$3 = usage2.inputTokenDetails) == null ? void 0 : _b$3.noCacheTokens),
			cacheReadTokens: addTokenCounts((_c = usage1.inputTokenDetails) == null ? void 0 : _c.cacheReadTokens, (_d = usage2.inputTokenDetails) == null ? void 0 : _d.cacheReadTokens),
			cacheWriteTokens: addTokenCounts((_e = usage1.inputTokenDetails) == null ? void 0 : _e.cacheWriteTokens, (_f = usage2.inputTokenDetails) == null ? void 0 : _f.cacheWriteTokens)
		},
		outputTokens: addTokenCounts(usage1.outputTokens, usage2.outputTokens),
		outputTokenDetails: {
			textTokens: addTokenCounts((_g = usage1.outputTokenDetails) == null ? void 0 : _g.textTokens, (_h = usage2.outputTokenDetails) == null ? void 0 : _h.textTokens),
			reasoningTokens: addTokenCounts((_i = usage1.outputTokenDetails) == null ? void 0 : _i.reasoningTokens, (_j = usage2.outputTokenDetails) == null ? void 0 : _j.reasoningTokens)
		},
		totalTokens: addTokenCounts(usage1.totalTokens, usage2.totalTokens),
		reasoningTokens: addTokenCounts(usage1.reasoningTokens, usage2.reasoningTokens),
		cachedInputTokens: addTokenCounts(usage1.cachedInputTokens, usage2.cachedInputTokens)
	};
}
function addTokenCounts(tokenCount1, tokenCount2) {
	return tokenCount1 == null && tokenCount2 == null ? void 0 : (tokenCount1 != null ? tokenCount1 : 0) + (tokenCount2 != null ? tokenCount2 : 0);
}
function mergeObjects(base, overrides) {
	if (base === void 0 && overrides === void 0) return;
	if (base === void 0) return overrides;
	if (overrides === void 0) return base;
	const result = { ...base };
	for (const key in overrides) if (Object.prototype.hasOwnProperty.call(overrides, key)) {
		const overridesValue = overrides[key];
		if (overridesValue === void 0) continue;
		const baseValue = key in base ? base[key] : void 0;
		const isSourceObject = overridesValue !== null && typeof overridesValue === "object" && !Array.isArray(overridesValue) && !(overridesValue instanceof Date) && !(overridesValue instanceof RegExp);
		const isTargetObject = baseValue !== null && baseValue !== void 0 && typeof baseValue === "object" && !Array.isArray(baseValue) && !(baseValue instanceof Date) && !(baseValue instanceof RegExp);
		if (isSourceObject && isTargetObject) result[key] = mergeObjects(baseValue, overridesValue);
		else result[key] = overridesValue;
	}
	return result;
}
function getRetryDelayInMs({ error, exponentialBackoffDelay }) {
	const headers = error.responseHeaders;
	if (!headers) return exponentialBackoffDelay;
	let ms;
	const retryAfterMs = headers["retry-after-ms"];
	if (retryAfterMs) {
		const timeoutMs = parseFloat(retryAfterMs);
		if (!Number.isNaN(timeoutMs)) ms = timeoutMs;
	}
	const retryAfter = headers["retry-after"];
	if (retryAfter && ms === void 0) {
		const timeoutSeconds = parseFloat(retryAfter);
		if (!Number.isNaN(timeoutSeconds)) ms = timeoutSeconds * 1e3;
		else ms = Date.parse(retryAfter) - Date.now();
	}
	if (ms != null && !Number.isNaN(ms) && 0 <= ms && (ms < 60 * 1e3 || ms < exponentialBackoffDelay)) return ms;
	return exponentialBackoffDelay;
}
var retryWithExponentialBackoffRespectingRetryHeaders = ({ maxRetries = 2, initialDelayInMs = 2e3, backoffFactor = 2, abortSignal } = {}) => async (f) => _retryWithExponentialBackoff(f, {
	maxRetries,
	delayInMs: initialDelayInMs,
	backoffFactor,
	abortSignal
});
async function _retryWithExponentialBackoff(f, { maxRetries, delayInMs, backoffFactor, abortSignal }, errors = []) {
	try {
		return await f();
	} catch (error) {
		if (isAbortError(error)) throw error;
		if (maxRetries === 0) throw error;
		const errorMessage = getErrorMessage(error);
		const newErrors = [...errors, error];
		const tryNumber = newErrors.length;
		if (tryNumber > maxRetries) throw new RetryError({
			message: `Failed after ${tryNumber} attempts. Last error: ${errorMessage}`,
			reason: "maxRetriesExceeded",
			errors: newErrors
		});
		if (error instanceof Error && APICallError.isInstance(error) && error.isRetryable === true && tryNumber <= maxRetries) {
			await delay(getRetryDelayInMs({
				error,
				exponentialBackoffDelay: delayInMs
			}), { abortSignal });
			return _retryWithExponentialBackoff(f, {
				maxRetries,
				delayInMs: backoffFactor * delayInMs,
				backoffFactor,
				abortSignal
			}, newErrors);
		}
		if (tryNumber === 1) throw error;
		throw new RetryError({
			message: `Failed after ${tryNumber} attempts with non-retryable error: '${errorMessage}'`,
			reason: "errorNotRetryable",
			errors: newErrors
		});
	}
}
function prepareRetries({ maxRetries, abortSignal }) {
	if (maxRetries != null) {
		if (!Number.isInteger(maxRetries)) throw new InvalidArgumentError({
			parameter: "maxRetries",
			value: maxRetries,
			message: "maxRetries must be an integer"
		});
		if (maxRetries < 0) throw new InvalidArgumentError({
			parameter: "maxRetries",
			value: maxRetries,
			message: "maxRetries must be >= 0"
		});
	}
	const maxRetriesResult = maxRetries != null ? maxRetries : 2;
	return {
		maxRetries: maxRetriesResult,
		retry: retryWithExponentialBackoffRespectingRetryHeaders({
			maxRetries: maxRetriesResult,
			abortSignal
		})
	};
}
function collectToolApprovals({ messages }) {
	const lastMessage = messages.at(-1);
	if ((lastMessage == null ? void 0 : lastMessage.role) != "tool") return {
		approvedToolApprovals: [],
		deniedToolApprovals: []
	};
	const toolCallsByToolCallId = {};
	for (const message of messages) if (message.role === "assistant" && typeof message.content !== "string") {
		const content = message.content;
		for (const part of content) if (part.type === "tool-call") toolCallsByToolCallId[part.toolCallId] = part;
	}
	const toolApprovalRequestsByApprovalId = {};
	for (const message of messages) if (message.role === "assistant" && typeof message.content !== "string") {
		const content = message.content;
		for (const part of content) if (part.type === "tool-approval-request") toolApprovalRequestsByApprovalId[part.approvalId] = part;
	}
	const toolResults = {};
	for (const part of lastMessage.content) if (part.type === "tool-result") toolResults[part.toolCallId] = part;
	const approvedToolApprovals = [];
	const deniedToolApprovals = [];
	const approvalResponses = lastMessage.content.filter((part) => part.type === "tool-approval-response");
	for (const approvalResponse of approvalResponses) {
		const approvalRequest = toolApprovalRequestsByApprovalId[approvalResponse.approvalId];
		if (approvalRequest == null) throw new InvalidToolApprovalError({ approvalId: approvalResponse.approvalId });
		if (toolResults[approvalRequest.toolCallId] != null) continue;
		const toolCall = toolCallsByToolCallId[approvalRequest.toolCallId];
		if (toolCall == null) throw new ToolCallNotFoundForApprovalError({
			toolCallId: approvalRequest.toolCallId,
			approvalId: approvalRequest.approvalId
		});
		const approval = {
			approvalRequest,
			approvalResponse,
			toolCall
		};
		if (approvalResponse.approved) approvedToolApprovals.push(approval);
		else deniedToolApprovals.push(approval);
	}
	return {
		approvedToolApprovals,
		deniedToolApprovals
	};
}
async function executeToolCall({ toolCall, tools, tracer, telemetry, messages, abortSignal, experimental_context, onPreliminaryToolResult }) {
	const { toolName, toolCallId, input } = toolCall;
	const tool2 = tools == null ? void 0 : tools[toolName];
	if ((tool2 == null ? void 0 : tool2.execute) == null) return;
	return recordSpan({
		name: "ai.toolCall",
		attributes: selectTelemetryAttributes({
			telemetry,
			attributes: {
				...assembleOperationName({
					operationId: "ai.toolCall",
					telemetry
				}),
				"ai.toolCall.name": toolName,
				"ai.toolCall.id": toolCallId,
				"ai.toolCall.args": { output: () => JSON.stringify(input) }
			}
		}),
		tracer,
		fn: async (span) => {
			let output;
			try {
				const stream = executeTool({
					execute: tool2.execute.bind(tool2),
					input,
					options: {
						toolCallId,
						messages,
						abortSignal,
						experimental_context
					}
				});
				for await (const part of stream) if (part.type === "preliminary") onPreliminaryToolResult?.({
					...toolCall,
					type: "tool-result",
					output: part.output,
					preliminary: true
				});
				else output = part.output;
			} catch (error) {
				recordErrorOnSpan(span, error);
				return {
					type: "tool-error",
					toolCallId,
					toolName,
					input,
					error,
					dynamic: tool2.type === "dynamic",
					...toolCall.providerMetadata != null ? { providerMetadata: toolCall.providerMetadata } : {}
				};
			}
			try {
				span.setAttributes(await selectTelemetryAttributes({
					telemetry,
					attributes: { "ai.toolCall.result": { output: () => JSON.stringify(output) } }
				}));
			} catch (ignored) {}
			return {
				type: "tool-result",
				toolCallId,
				toolName,
				input,
				output,
				dynamic: tool2.type === "dynamic",
				...toolCall.providerMetadata != null ? { providerMetadata: toolCall.providerMetadata } : {}
			};
		}
	});
}
function extractTextContent(content) {
	const parts = content.filter((content2) => content2.type === "text");
	if (parts.length === 0) return;
	return parts.map((content2) => content2.text).join("");
}
var DefaultGeneratedFile = class {
	constructor({ data, mediaType }) {
		const isUint8Array = data instanceof Uint8Array;
		this.base64Data = isUint8Array ? void 0 : data;
		this.uint8ArrayData = isUint8Array ? data : void 0;
		this.mediaType = mediaType;
	}
	get base64() {
		if (this.base64Data == null) this.base64Data = convertUint8ArrayToBase64(this.uint8ArrayData);
		return this.base64Data;
	}
	get uint8Array() {
		if (this.uint8ArrayData == null) this.uint8ArrayData = convertBase64ToUint8Array(this.base64Data);
		return this.uint8ArrayData;
	}
};
var DefaultGeneratedFileWithType = class extends DefaultGeneratedFile {
	constructor(options) {
		super(options);
		this.type = "file";
	}
};
async function isApprovalNeeded({ tool: tool2, toolCall, messages, experimental_context }) {
	if (tool2.needsApproval == null) return false;
	if (typeof tool2.needsApproval === "boolean") return tool2.needsApproval;
	return await tool2.needsApproval(toolCall.input, {
		toolCallId: toolCall.toolCallId,
		messages,
		experimental_context
	});
}
var output_exports = {};
__export(output_exports, {
	array: () => array,
	choice: () => choice,
	json: () => json,
	object: () => object,
	text: () => text
});
function fixJson(input) {
	const stack = ["ROOT"];
	let lastValidIndex = -1;
	let literalStart = null;
	function processValueStart(char, i, swapState) {
		switch (char) {
			case "\"":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_STRING");
				break;
			case "f":
			case "t":
			case "n":
				lastValidIndex = i;
				literalStart = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_LITERAL");
				break;
			case "-":
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_NUMBER");
				break;
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_NUMBER");
				break;
			case "{":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_OBJECT_START");
				break;
			case "[":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_ARRAY_START");
				break;
		}
	}
	function processAfterObjectValue(char, i) {
		switch (char) {
			case ",":
				stack.pop();
				stack.push("INSIDE_OBJECT_AFTER_COMMA");
				break;
			case "}":
				lastValidIndex = i;
				stack.pop();
				break;
		}
	}
	function processAfterArrayValue(char, i) {
		switch (char) {
			case ",":
				stack.pop();
				stack.push("INSIDE_ARRAY_AFTER_COMMA");
				break;
			case "]":
				lastValidIndex = i;
				stack.pop();
				break;
		}
	}
	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		switch (stack[stack.length - 1]) {
			case "ROOT":
				processValueStart(char, i, "FINISH");
				break;
			case "INSIDE_OBJECT_START":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_KEY");
						break;
					case "}":
						lastValidIndex = i;
						stack.pop();
						break;
				}
				break;
			case "INSIDE_OBJECT_AFTER_COMMA":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_KEY");
						break;
				}
				break;
			case "INSIDE_OBJECT_KEY":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_AFTER_KEY");
						break;
				}
				break;
			case "INSIDE_OBJECT_AFTER_KEY":
				switch (char) {
					case ":":
						stack.pop();
						stack.push("INSIDE_OBJECT_BEFORE_VALUE");
						break;
				}
				break;
			case "INSIDE_OBJECT_BEFORE_VALUE":
				processValueStart(char, i, "INSIDE_OBJECT_AFTER_VALUE");
				break;
			case "INSIDE_OBJECT_AFTER_VALUE":
				processAfterObjectValue(char, i);
				break;
			case "INSIDE_STRING":
				switch (char) {
					case "\"":
						stack.pop();
						lastValidIndex = i;
						break;
					case "\\":
						stack.push("INSIDE_STRING_ESCAPE");
						break;
					default: lastValidIndex = i;
				}
				break;
			case "INSIDE_ARRAY_START":
				switch (char) {
					case "]":
						lastValidIndex = i;
						stack.pop();
						break;
					default:
						lastValidIndex = i;
						processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
						break;
				}
				break;
			case "INSIDE_ARRAY_AFTER_VALUE":
				switch (char) {
					case ",":
						stack.pop();
						stack.push("INSIDE_ARRAY_AFTER_COMMA");
						break;
					case "]":
						lastValidIndex = i;
						stack.pop();
						break;
					default:
						lastValidIndex = i;
						break;
				}
				break;
			case "INSIDE_ARRAY_AFTER_COMMA":
				processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
				break;
			case "INSIDE_STRING_ESCAPE":
				stack.pop();
				lastValidIndex = i;
				break;
			case "INSIDE_NUMBER":
				switch (char) {
					case "0":
					case "1":
					case "2":
					case "3":
					case "4":
					case "5":
					case "6":
					case "7":
					case "8":
					case "9":
						lastValidIndex = i;
						break;
					case "e":
					case "E":
					case "-":
					case ".": break;
					case ",":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
						if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
						break;
					case "}":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
						break;
					case "]":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
						break;
					default:
						stack.pop();
						break;
				}
				break;
			case "INSIDE_LITERAL": {
				const partialLiteral = input.substring(literalStart, i + 1);
				if (!"false".startsWith(partialLiteral) && !"true".startsWith(partialLiteral) && !"null".startsWith(partialLiteral)) {
					stack.pop();
					if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
					else if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
				} else lastValidIndex = i;
				break;
			}
		}
	}
	let result = input.slice(0, lastValidIndex + 1);
	for (let i = stack.length - 1; i >= 0; i--) switch (stack[i]) {
		case "INSIDE_STRING":
			result += "\"";
			break;
		case "INSIDE_OBJECT_KEY":
		case "INSIDE_OBJECT_AFTER_KEY":
		case "INSIDE_OBJECT_AFTER_COMMA":
		case "INSIDE_OBJECT_START":
		case "INSIDE_OBJECT_BEFORE_VALUE":
		case "INSIDE_OBJECT_AFTER_VALUE":
			result += "}";
			break;
		case "INSIDE_ARRAY_START":
		case "INSIDE_ARRAY_AFTER_COMMA":
		case "INSIDE_ARRAY_AFTER_VALUE":
			result += "]";
			break;
		case "INSIDE_LITERAL": {
			const partialLiteral = input.substring(literalStart, input.length);
			if ("true".startsWith(partialLiteral)) result += "true".slice(partialLiteral.length);
			else if ("false".startsWith(partialLiteral)) result += "false".slice(partialLiteral.length);
			else if ("null".startsWith(partialLiteral)) result += "null".slice(partialLiteral.length);
		}
	}
	return result;
}
async function parsePartialJson(jsonText) {
	if (jsonText === void 0) return {
		value: void 0,
		state: "undefined-input"
	};
	let result = await safeParseJSON({ text: jsonText });
	if (result.success) return {
		value: result.value,
		state: "successful-parse"
	};
	result = await safeParseJSON({ text: fixJson(jsonText) });
	if (result.success) return {
		value: result.value,
		state: "repaired-parse"
	};
	return {
		value: void 0,
		state: "failed-parse"
	};
}
var text = () => ({
	name: "text",
	responseFormat: Promise.resolve({ type: "text" }),
	async parseCompleteOutput({ text: text2 }) {
		return text2;
	},
	async parsePartialOutput({ text: text2 }) {
		return { partial: text2 };
	},
	createElementStreamTransform() {}
});
var object = ({ schema: inputSchema, name: name20, description }) => {
	const schema = asSchema(inputSchema);
	return {
		name: "object",
		responseFormat: resolve(schema.jsonSchema).then((jsonSchema2) => ({
			type: "json",
			schema: jsonSchema2,
			...name20 != null && { name: name20 },
			...description != null && { description }
		})),
		async parseCompleteOutput({ text: text2 }, context2) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context2.response,
				usage: context2.usage,
				finishReason: context2.finishReason
			});
			const validationResult = await safeValidateTypes({
				value: parseResult.value,
				schema
			});
			if (!validationResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: validationResult.error,
				text: text2,
				response: context2.response,
				usage: context2.usage,
				finishReason: context2.finishReason
			});
			return validationResult.value;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": return { partial: result.value };
			}
		},
		createElementStreamTransform() {}
	};
};
var array = ({ element: inputElementSchema, name: name20, description }) => {
	const elementSchema = asSchema(inputElementSchema);
	return {
		name: "array",
		responseFormat: resolve(elementSchema.jsonSchema).then((jsonSchema2) => {
			const { $schema, ...itemSchema } = jsonSchema2;
			return {
				type: "json",
				schema: {
					$schema: "http://json-schema.org/draft-07/schema#",
					type: "object",
					properties: { elements: {
						type: "array",
						items: itemSchema
					} },
					required: ["elements"],
					additionalProperties: false
				},
				...name20 != null && { name: name20 },
				...description != null && { description }
			};
		}),
		async parseCompleteOutput({ text: text2 }, context2) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context2.response,
				usage: context2.usage,
				finishReason: context2.finishReason
			});
			const outerValue = parseResult.value;
			if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: new TypeValidationError({
					value: outerValue,
					cause: "response must be an object with an elements array"
				}),
				text: text2,
				response: context2.response,
				usage: context2.usage,
				finishReason: context2.finishReason
			});
			for (const element of outerValue.elements) {
				const validationResult = await safeValidateTypes({
					value: element,
					schema: elementSchema
				});
				if (!validationResult.success) throw new NoObjectGeneratedError({
					message: "No object generated: response did not match schema.",
					cause: validationResult.error,
					text: text2,
					response: context2.response,
					usage: context2.usage,
					finishReason: context2.finishReason
				});
			}
			return outerValue.elements;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": {
					const outerValue = result.value;
					if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) return;
					const rawElements = result.state === "repaired-parse" && outerValue.elements.length > 0 ? outerValue.elements.slice(0, -1) : outerValue.elements;
					const parsedElements = [];
					for (const rawElement of rawElements) {
						const validationResult = await safeValidateTypes({
							value: rawElement,
							schema: elementSchema
						});
						if (validationResult.success) parsedElements.push(validationResult.value);
					}
					return { partial: parsedElements };
				}
			}
		},
		createElementStreamTransform() {
			let publishedElements = 0;
			return new TransformStream({ transform({ partialOutput }, controller) {
				if (partialOutput != null) for (; publishedElements < partialOutput.length; publishedElements++) controller.enqueue(partialOutput[publishedElements]);
			} });
		}
	};
};
var choice = ({ options: choiceOptions, name: name20, description }) => {
	return {
		name: "choice",
		responseFormat: Promise.resolve({
			type: "json",
			schema: {
				$schema: "http://json-schema.org/draft-07/schema#",
				type: "object",
				properties: { result: {
					type: "string",
					enum: choiceOptions
				} },
				required: ["result"],
				additionalProperties: false
			},
			...name20 != null && { name: name20 },
			...description != null && { description }
		}),
		async parseCompleteOutput({ text: text2 }, context2) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context2.response,
				usage: context2.usage,
				finishReason: context2.finishReason
			});
			const outerValue = parseResult.value;
			if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string" || !choiceOptions.includes(outerValue.result)) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: new TypeValidationError({
					value: outerValue,
					cause: "response must be an object that contains a choice value."
				}),
				text: text2,
				response: context2.response,
				usage: context2.usage,
				finishReason: context2.finishReason
			});
			return outerValue.result;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": {
					const outerValue = result.value;
					if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string") return;
					const potentialMatches = choiceOptions.filter((choiceOption) => choiceOption.startsWith(outerValue.result));
					if (result.state === "successful-parse") return potentialMatches.includes(outerValue.result) ? { partial: outerValue.result } : void 0;
					else return potentialMatches.length === 1 ? { partial: potentialMatches[0] } : void 0;
				}
			}
		},
		createElementStreamTransform() {}
	};
};
var json = ({ name: name20, description } = {}) => {
	return {
		name: "json",
		responseFormat: Promise.resolve({
			type: "json",
			...name20 != null && { name: name20 },
			...description != null && { description }
		}),
		async parseCompleteOutput({ text: text2 }, context2) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context2.response,
				usage: context2.usage,
				finishReason: context2.finishReason
			});
			return parseResult.value;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": return result.value === void 0 ? void 0 : { partial: result.value };
			}
		},
		createElementStreamTransform() {}
	};
};
async function parseToolCall({ toolCall, tools, repairToolCall, system, messages }) {
	var _a20;
	try {
		if (tools == null) {
			if (toolCall.providerExecuted && toolCall.dynamic) return await parseProviderExecutedDynamicToolCall(toolCall);
			throw new NoSuchToolError({ toolName: toolCall.toolName });
		}
		try {
			return await doParseToolCall({
				toolCall,
				tools
			});
		} catch (error) {
			if (repairToolCall == null || !(NoSuchToolError.isInstance(error) || InvalidToolInputError.isInstance(error))) throw error;
			let repairedToolCall = null;
			try {
				repairedToolCall = await repairToolCall({
					toolCall,
					tools,
					inputSchema: async ({ toolName }) => {
						const { inputSchema } = tools[toolName];
						return await asSchema(inputSchema).jsonSchema;
					},
					system,
					messages,
					error
				});
			} catch (repairError) {
				throw new ToolCallRepairError({
					cause: repairError,
					originalError: error
				});
			}
			if (repairedToolCall == null) throw error;
			return await doParseToolCall({
				toolCall: repairedToolCall,
				tools
			});
		}
	} catch (error) {
		const parsedInput = await safeParseJSON({ text: toolCall.input });
		const input = parsedInput.success ? parsedInput.value : toolCall.input;
		return {
			type: "tool-call",
			toolCallId: toolCall.toolCallId,
			toolName: toolCall.toolName,
			input,
			dynamic: true,
			invalid: true,
			error,
			title: (_a20 = tools == null ? void 0 : tools[toolCall.toolName]) == null ? void 0 : _a20.title,
			providerExecuted: toolCall.providerExecuted,
			providerMetadata: toolCall.providerMetadata
		};
	}
}
async function parseProviderExecutedDynamicToolCall(toolCall) {
	const parseResult = toolCall.input.trim() === "" ? {
		success: true,
		value: {}
	} : await safeParseJSON({ text: toolCall.input });
	if (parseResult.success === false) throw new InvalidToolInputError({
		toolName: toolCall.toolName,
		toolInput: toolCall.input,
		cause: parseResult.error
	});
	return {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName: toolCall.toolName,
		input: parseResult.value,
		providerExecuted: true,
		dynamic: true,
		providerMetadata: toolCall.providerMetadata
	};
}
async function doParseToolCall({ toolCall, tools }) {
	const toolName = toolCall.toolName;
	const tool2 = tools[toolName];
	if (tool2 == null) {
		if (toolCall.providerExecuted && toolCall.dynamic) return await parseProviderExecutedDynamicToolCall(toolCall);
		throw new NoSuchToolError({
			toolName: toolCall.toolName,
			availableTools: Object.keys(tools)
		});
	}
	const schema = asSchema(tool2.inputSchema);
	const parseResult = toolCall.input.trim() === "" ? await safeValidateTypes({
		value: {},
		schema
	}) : await safeParseJSON({
		text: toolCall.input,
		schema
	});
	if (parseResult.success === false) throw new InvalidToolInputError({
		toolName,
		toolInput: toolCall.input,
		cause: parseResult.error
	});
	return tool2.type === "dynamic" ? {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName: toolCall.toolName,
		input: parseResult.value,
		providerExecuted: toolCall.providerExecuted,
		providerMetadata: toolCall.providerMetadata,
		dynamic: true,
		title: tool2.title
	} : {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName,
		input: parseResult.value,
		providerExecuted: toolCall.providerExecuted,
		providerMetadata: toolCall.providerMetadata,
		title: tool2.title
	};
}
var DefaultStepResult = class {
	constructor({ content, finishReason, rawFinishReason, usage, warnings, request, response, providerMetadata }) {
		this.content = content;
		this.finishReason = finishReason;
		this.rawFinishReason = rawFinishReason;
		this.usage = usage;
		this.warnings = warnings;
		this.request = request;
		this.response = response;
		this.providerMetadata = providerMetadata;
	}
	get text() {
		return this.content.filter((part) => part.type === "text").map((part) => part.text).join("");
	}
	get reasoning() {
		return this.content.filter((part) => part.type === "reasoning");
	}
	get reasoningText() {
		return this.reasoning.length === 0 ? void 0 : this.reasoning.map((part) => part.text).join("");
	}
	get files() {
		return this.content.filter((part) => part.type === "file").map((part) => part.file);
	}
	get sources() {
		return this.content.filter((part) => part.type === "source");
	}
	get toolCalls() {
		return this.content.filter((part) => part.type === "tool-call");
	}
	get staticToolCalls() {
		return this.toolCalls.filter((toolCall) => toolCall.dynamic !== true);
	}
	get dynamicToolCalls() {
		return this.toolCalls.filter((toolCall) => toolCall.dynamic === true);
	}
	get toolResults() {
		return this.content.filter((part) => part.type === "tool-result");
	}
	get staticToolResults() {
		return this.toolResults.filter((toolResult) => toolResult.dynamic !== true);
	}
	get dynamicToolResults() {
		return this.toolResults.filter((toolResult) => toolResult.dynamic === true);
	}
};
function stepCountIs(stepCount) {
	return ({ steps }) => steps.length === stepCount;
}
async function isStopConditionMet({ stopConditions, steps }) {
	return (await Promise.all(stopConditions.map((condition) => condition({ steps })))).some((result) => result);
}
async function toResponseMessages({ content: inputContent, tools }) {
	const responseMessages = [];
	const content = [];
	for (const part of inputContent) {
		if (part.type === "source") continue;
		if ((part.type === "tool-result" || part.type === "tool-error") && !part.providerExecuted) continue;
		if (part.type === "text" && part.text.length === 0) continue;
		switch (part.type) {
			case "text":
				content.push({
					type: "text",
					text: part.text,
					providerOptions: part.providerMetadata
				});
				break;
			case "reasoning":
				content.push({
					type: "reasoning",
					text: part.text,
					providerOptions: part.providerMetadata
				});
				break;
			case "file":
				content.push({
					type: "file",
					data: part.file.base64,
					mediaType: part.file.mediaType,
					providerOptions: part.providerMetadata
				});
				break;
			case "tool-call":
				content.push({
					type: "tool-call",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: part.input,
					providerExecuted: part.providerExecuted,
					providerOptions: part.providerMetadata
				});
				break;
			case "tool-result": {
				const output = await createToolModelOutput({
					toolCallId: part.toolCallId,
					input: part.input,
					tool: tools == null ? void 0 : tools[part.toolName],
					output: part.output,
					errorMode: "none"
				});
				content.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					output,
					providerOptions: part.providerMetadata
				});
				break;
			}
			case "tool-error": {
				const output = await createToolModelOutput({
					toolCallId: part.toolCallId,
					input: part.input,
					tool: tools == null ? void 0 : tools[part.toolName],
					output: part.error,
					errorMode: "json"
				});
				content.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					output,
					providerOptions: part.providerMetadata
				});
				break;
			}
			case "tool-approval-request":
				content.push({
					type: "tool-approval-request",
					approvalId: part.approvalId,
					toolCallId: part.toolCall.toolCallId
				});
				break;
		}
	}
	if (content.length > 0) responseMessages.push({
		role: "assistant",
		content
	});
	const toolResultContent = [];
	for (const part of inputContent) {
		if (!(part.type === "tool-result" || part.type === "tool-error") || part.providerExecuted) continue;
		const output = await createToolModelOutput({
			toolCallId: part.toolCallId,
			input: part.input,
			tool: tools == null ? void 0 : tools[part.toolName],
			output: part.type === "tool-result" ? part.output : part.error,
			errorMode: part.type === "tool-error" ? "text" : "none"
		});
		toolResultContent.push({
			type: "tool-result",
			toolCallId: part.toolCallId,
			toolName: part.toolName,
			output,
			...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
		});
	}
	if (toolResultContent.length > 0) responseMessages.push({
		role: "tool",
		content: toolResultContent
	});
	return responseMessages;
}
function mergeAbortSignals(...signals) {
	const validSignals = signals.filter((signal) => signal != null);
	if (validSignals.length === 0) return;
	if (validSignals.length === 1) return validSignals[0];
	const controller = new AbortController();
	for (const signal of validSignals) {
		if (signal.aborted) {
			controller.abort(signal.reason);
			return controller.signal;
		}
		signal.addEventListener("abort", () => {
			controller.abort(signal.reason);
		}, { once: true });
	}
	return controller.signal;
}
var originalGenerateId = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
async function generateText({ model: modelArg, tools, toolChoice, system, prompt, messages, maxRetries: maxRetriesArg, abortSignal, timeout, headers, stopWhen = stepCountIs(1), experimental_output, output = experimental_output, experimental_telemetry: telemetry, providerOptions, experimental_activeTools, activeTools = experimental_activeTools, experimental_prepareStep, prepareStep = experimental_prepareStep, experimental_repairToolCall: repairToolCall, experimental_download: download2, experimental_context, experimental_include: include, _internal: { generateId: generateId2 = originalGenerateId } = {}, onStepFinish, onFinish, ...settings }) {
	const model = resolveLanguageModel(modelArg);
	const stopConditions = asArray(stopWhen);
	const totalTimeoutMs = getTotalTimeoutMs(timeout);
	const stepTimeoutMs = getStepTimeoutMs(timeout);
	const stepAbortController = stepTimeoutMs != null ? new AbortController() : void 0;
	const mergedAbortSignal = mergeAbortSignals(abortSignal, totalTimeoutMs != null ? AbortSignal.timeout(totalTimeoutMs) : void 0, stepAbortController == null ? void 0 : stepAbortController.signal);
	const { maxRetries, retry } = prepareRetries({
		maxRetries: maxRetriesArg,
		abortSignal: mergedAbortSignal
	});
	const callSettings = prepareCallSettings(settings);
	const headersWithUserAgent = withUserAgentSuffix(headers != null ? headers : {}, `ai/${VERSION}`);
	const baseTelemetryAttributes = getBaseTelemetryAttributes({
		model,
		telemetry,
		headers: headersWithUserAgent,
		settings: {
			...callSettings,
			maxRetries
		}
	});
	const initialPrompt = await standardizePrompt({
		system,
		prompt,
		messages
	});
	const tracer = getTracer(telemetry);
	try {
		return await recordSpan({
			name: "ai.generateText",
			attributes: selectTelemetryAttributes({
				telemetry,
				attributes: {
					...assembleOperationName({
						operationId: "ai.generateText",
						telemetry
					}),
					...baseTelemetryAttributes,
					"ai.model.provider": model.provider,
					"ai.model.id": model.modelId,
					"ai.prompt": { input: () => JSON.stringify({
						system,
						prompt,
						messages
					}) }
				}
			}),
			tracer,
			fn: async (span) => {
				var _a20, _b$3, _c, _d, _e, _f, _g, _h, _i, _j, _k;
				const initialMessages = initialPrompt.messages;
				const responseMessages = [];
				const { approvedToolApprovals, deniedToolApprovals } = collectToolApprovals({ messages: initialMessages });
				const localApprovedToolApprovals = approvedToolApprovals.filter((toolApproval) => !toolApproval.toolCall.providerExecuted);
				if (deniedToolApprovals.length > 0 || localApprovedToolApprovals.length > 0) {
					const toolOutputs = await executeTools({
						toolCalls: localApprovedToolApprovals.map((toolApproval) => toolApproval.toolCall),
						tools,
						tracer,
						telemetry,
						messages: initialMessages,
						abortSignal: mergedAbortSignal,
						experimental_context
					});
					const toolContent = [];
					for (const output2 of toolOutputs) {
						const modelOutput = await createToolModelOutput({
							toolCallId: output2.toolCallId,
							input: output2.input,
							tool: tools == null ? void 0 : tools[output2.toolName],
							output: output2.type === "tool-result" ? output2.output : output2.error,
							errorMode: output2.type === "tool-error" ? "json" : "none"
						});
						toolContent.push({
							type: "tool-result",
							toolCallId: output2.toolCallId,
							toolName: output2.toolName,
							output: modelOutput
						});
					}
					for (const toolApproval of deniedToolApprovals) toolContent.push({
						type: "tool-result",
						toolCallId: toolApproval.toolCall.toolCallId,
						toolName: toolApproval.toolCall.toolName,
						output: {
							type: "execution-denied",
							reason: toolApproval.approvalResponse.reason,
							...toolApproval.toolCall.providerExecuted && { providerOptions: { openai: { approvalId: toolApproval.approvalResponse.approvalId } } }
						}
					});
					responseMessages.push({
						role: "tool",
						content: toolContent
					});
				}
				const providerExecutedToolApprovals = [...approvedToolApprovals, ...deniedToolApprovals].filter((toolApproval) => toolApproval.toolCall.providerExecuted);
				if (providerExecutedToolApprovals.length > 0) responseMessages.push({
					role: "tool",
					content: providerExecutedToolApprovals.map((toolApproval) => ({
						type: "tool-approval-response",
						approvalId: toolApproval.approvalResponse.approvalId,
						approved: toolApproval.approvalResponse.approved,
						reason: toolApproval.approvalResponse.reason,
						providerExecuted: true
					}))
				});
				const callSettings2 = prepareCallSettings(settings);
				let currentModelResponse;
				let clientToolCalls = [];
				let clientToolOutputs = [];
				const steps = [];
				const pendingDeferredToolCalls = /* @__PURE__ */ new Map();
				do {
					const stepTimeoutId = stepTimeoutMs != null ? setTimeout(() => stepAbortController.abort(), stepTimeoutMs) : void 0;
					try {
						const stepInputMessages = [...initialMessages, ...responseMessages];
						const prepareStepResult = await (prepareStep == null ? void 0 : prepareStep({
							model,
							steps,
							stepNumber: steps.length,
							messages: stepInputMessages,
							experimental_context
						}));
						const stepModel = resolveLanguageModel((_a20 = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _a20 : model);
						const promptMessages = await convertToLanguageModelPrompt({
							prompt: {
								system: (_b$3 = prepareStepResult == null ? void 0 : prepareStepResult.system) != null ? _b$3 : initialPrompt.system,
								messages: (_c = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _c : stepInputMessages
							},
							supportedUrls: await stepModel.supportedUrls,
							download: download2
						});
						experimental_context = (_d = prepareStepResult == null ? void 0 : prepareStepResult.experimental_context) != null ? _d : experimental_context;
						const { toolChoice: stepToolChoice, tools: stepTools } = await prepareToolsAndToolChoice({
							tools,
							toolChoice: (_e = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _e : toolChoice,
							activeTools: (_f = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _f : activeTools
						});
						currentModelResponse = await retry(() => {
							var _a21;
							return recordSpan({
								name: "ai.generateText.doGenerate",
								attributes: selectTelemetryAttributes({
									telemetry,
									attributes: {
										...assembleOperationName({
											operationId: "ai.generateText.doGenerate",
											telemetry
										}),
										...baseTelemetryAttributes,
										"ai.model.provider": stepModel.provider,
										"ai.model.id": stepModel.modelId,
										"ai.prompt.messages": { input: () => stringifyForTelemetry(promptMessages) },
										"ai.prompt.tools": { input: () => stepTools == null ? void 0 : stepTools.map((tool2) => JSON.stringify(tool2)) },
										"ai.prompt.toolChoice": { input: () => stepToolChoice != null ? JSON.stringify(stepToolChoice) : void 0 },
										"gen_ai.system": stepModel.provider,
										"gen_ai.request.model": stepModel.modelId,
										"gen_ai.request.frequency_penalty": settings.frequencyPenalty,
										"gen_ai.request.max_tokens": settings.maxOutputTokens,
										"gen_ai.request.presence_penalty": settings.presencePenalty,
										"gen_ai.request.stop_sequences": settings.stopSequences,
										"gen_ai.request.temperature": (_a21 = settings.temperature) != null ? _a21 : void 0,
										"gen_ai.request.top_k": settings.topK,
										"gen_ai.request.top_p": settings.topP
									}
								}),
								tracer,
								fn: async (span2) => {
									var _a22, _b2$2, _c2, _d2, _e2, _f2, _g2, _h2;
									const stepProviderOptions = mergeObjects(providerOptions, prepareStepResult == null ? void 0 : prepareStepResult.providerOptions);
									const result = await stepModel.doGenerate({
										...callSettings2,
										tools: stepTools,
										toolChoice: stepToolChoice,
										responseFormat: await (output == null ? void 0 : output.responseFormat),
										prompt: promptMessages,
										providerOptions: stepProviderOptions,
										abortSignal: mergedAbortSignal,
										headers: headersWithUserAgent
									});
									const responseData = {
										id: (_b2$2 = (_a22 = result.response) == null ? void 0 : _a22.id) != null ? _b2$2 : generateId2(),
										timestamp: (_d2 = (_c2 = result.response) == null ? void 0 : _c2.timestamp) != null ? _d2 : /* @__PURE__ */ new Date(),
										modelId: (_f2 = (_e2 = result.response) == null ? void 0 : _e2.modelId) != null ? _f2 : stepModel.modelId,
										headers: (_g2 = result.response) == null ? void 0 : _g2.headers,
										body: (_h2 = result.response) == null ? void 0 : _h2.body
									};
									span2.setAttributes(await selectTelemetryAttributes({
										telemetry,
										attributes: {
											"ai.response.finishReason": result.finishReason.unified,
											"ai.response.text": { output: () => extractTextContent(result.content) },
											"ai.response.toolCalls": { output: () => {
												const toolCalls = asToolCalls(result.content);
												return toolCalls == null ? void 0 : JSON.stringify(toolCalls);
											} },
											"ai.response.id": responseData.id,
											"ai.response.model": responseData.modelId,
											"ai.response.timestamp": responseData.timestamp.toISOString(),
											"ai.response.providerMetadata": JSON.stringify(result.providerMetadata),
											"ai.usage.promptTokens": result.usage.inputTokens.total,
											"ai.usage.completionTokens": result.usage.outputTokens.total,
											"gen_ai.response.finish_reasons": [result.finishReason.unified],
											"gen_ai.response.id": responseData.id,
											"gen_ai.response.model": responseData.modelId,
											"gen_ai.usage.input_tokens": result.usage.inputTokens.total,
											"gen_ai.usage.output_tokens": result.usage.outputTokens.total
										}
									}));
									return {
										...result,
										response: responseData
									};
								}
							});
						});
						const stepToolCalls = await Promise.all(currentModelResponse.content.filter((part) => part.type === "tool-call").map((toolCall) => parseToolCall({
							toolCall,
							tools,
							repairToolCall,
							system,
							messages: stepInputMessages
						})));
						const toolApprovalRequests = {};
						for (const toolCall of stepToolCalls) {
							if (toolCall.invalid) continue;
							const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
							if (tool2 == null) continue;
							if ((tool2 == null ? void 0 : tool2.onInputAvailable) != null) await tool2.onInputAvailable({
								input: toolCall.input,
								toolCallId: toolCall.toolCallId,
								messages: stepInputMessages,
								abortSignal: mergedAbortSignal,
								experimental_context
							});
							if (await isApprovalNeeded({
								tool: tool2,
								toolCall,
								messages: stepInputMessages,
								experimental_context
							})) toolApprovalRequests[toolCall.toolCallId] = {
								type: "tool-approval-request",
								approvalId: generateId2(),
								toolCall
							};
						}
						const invalidToolCalls = stepToolCalls.filter((toolCall) => toolCall.invalid && toolCall.dynamic);
						clientToolOutputs = [];
						for (const toolCall of invalidToolCalls) clientToolOutputs.push({
							type: "tool-error",
							toolCallId: toolCall.toolCallId,
							toolName: toolCall.toolName,
							input: toolCall.input,
							error: getErrorMessage(toolCall.error),
							dynamic: true
						});
						clientToolCalls = stepToolCalls.filter((toolCall) => !toolCall.providerExecuted);
						if (tools != null) clientToolOutputs.push(...await executeTools({
							toolCalls: clientToolCalls.filter((toolCall) => !toolCall.invalid && toolApprovalRequests[toolCall.toolCallId] == null),
							tools,
							tracer,
							telemetry,
							messages: stepInputMessages,
							abortSignal: mergedAbortSignal,
							experimental_context
						}));
						for (const toolCall of stepToolCalls) {
							if (!toolCall.providerExecuted) continue;
							const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
							if ((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults) {
								if (!currentModelResponse.content.some((part) => part.type === "tool-result" && part.toolCallId === toolCall.toolCallId)) pendingDeferredToolCalls.set(toolCall.toolCallId, { toolName: toolCall.toolName });
							}
						}
						for (const part of currentModelResponse.content) if (part.type === "tool-result") pendingDeferredToolCalls.delete(part.toolCallId);
						const stepContent = asContent({
							content: currentModelResponse.content,
							toolCalls: stepToolCalls,
							toolOutputs: clientToolOutputs,
							toolApprovalRequests: Object.values(toolApprovalRequests),
							tools
						});
						responseMessages.push(...await toResponseMessages({
							content: stepContent,
							tools
						}));
						const stepRequest = ((_g = include == null ? void 0 : include.requestBody) != null ? _g : true) ? (_h = currentModelResponse.request) != null ? _h : {} : {
							...currentModelResponse.request,
							body: void 0
						};
						const stepResponse = {
							...currentModelResponse.response,
							messages: structuredClone(responseMessages),
							body: ((_i = include == null ? void 0 : include.responseBody) != null ? _i : true) ? (_j = currentModelResponse.response) == null ? void 0 : _j.body : void 0
						};
						const currentStepResult = new DefaultStepResult({
							content: stepContent,
							finishReason: currentModelResponse.finishReason.unified,
							rawFinishReason: currentModelResponse.finishReason.raw,
							usage: asLanguageModelUsage(currentModelResponse.usage),
							warnings: currentModelResponse.warnings,
							providerMetadata: currentModelResponse.providerMetadata,
							request: stepRequest,
							response: stepResponse
						});
						logWarnings({
							warnings: (_k = currentModelResponse.warnings) != null ? _k : [],
							provider: stepModel.provider,
							model: stepModel.modelId
						});
						steps.push(currentStepResult);
						await (onStepFinish == null ? void 0 : onStepFinish(currentStepResult));
					} finally {
						if (stepTimeoutId != null) clearTimeout(stepTimeoutId);
					}
				} while ((clientToolCalls.length > 0 && clientToolOutputs.length === clientToolCalls.length || pendingDeferredToolCalls.size > 0) && !await isStopConditionMet({
					stopConditions,
					steps
				}));
				span.setAttributes(await selectTelemetryAttributes({
					telemetry,
					attributes: {
						"ai.response.finishReason": currentModelResponse.finishReason.unified,
						"ai.response.text": { output: () => extractTextContent(currentModelResponse.content) },
						"ai.response.toolCalls": { output: () => {
							const toolCalls = asToolCalls(currentModelResponse.content);
							return toolCalls == null ? void 0 : JSON.stringify(toolCalls);
						} },
						"ai.response.providerMetadata": JSON.stringify(currentModelResponse.providerMetadata),
						"ai.usage.promptTokens": currentModelResponse.usage.inputTokens.total,
						"ai.usage.completionTokens": currentModelResponse.usage.outputTokens.total
					}
				}));
				const lastStep = steps[steps.length - 1];
				const totalUsage = steps.reduce((totalUsage2, step) => {
					return addLanguageModelUsage(totalUsage2, step.usage);
				}, {
					inputTokens: void 0,
					outputTokens: void 0,
					totalTokens: void 0,
					reasoningTokens: void 0,
					cachedInputTokens: void 0
				});
				await (onFinish == null ? void 0 : onFinish({
					finishReason: lastStep.finishReason,
					rawFinishReason: lastStep.rawFinishReason,
					usage: lastStep.usage,
					content: lastStep.content,
					text: lastStep.text,
					reasoningText: lastStep.reasoningText,
					reasoning: lastStep.reasoning,
					files: lastStep.files,
					sources: lastStep.sources,
					toolCalls: lastStep.toolCalls,
					staticToolCalls: lastStep.staticToolCalls,
					dynamicToolCalls: lastStep.dynamicToolCalls,
					toolResults: lastStep.toolResults,
					staticToolResults: lastStep.staticToolResults,
					dynamicToolResults: lastStep.dynamicToolResults,
					request: lastStep.request,
					response: lastStep.response,
					warnings: lastStep.warnings,
					providerMetadata: lastStep.providerMetadata,
					steps,
					totalUsage,
					experimental_context
				}));
				let resolvedOutput;
				if (lastStep.finishReason === "stop") resolvedOutput = await (output != null ? output : text()).parseCompleteOutput({ text: lastStep.text }, {
					response: lastStep.response,
					usage: lastStep.usage,
					finishReason: lastStep.finishReason
				});
				return new DefaultGenerateTextResult({
					steps,
					totalUsage,
					output: resolvedOutput
				});
			}
		});
	} catch (error) {
		throw wrapGatewayError(error);
	}
}
async function executeTools({ toolCalls, tools, tracer, telemetry, messages, abortSignal, experimental_context }) {
	return (await Promise.all(toolCalls.map(async (toolCall) => executeToolCall({
		toolCall,
		tools,
		tracer,
		telemetry,
		messages,
		abortSignal,
		experimental_context
	})))).filter((output) => output != null);
}
var DefaultGenerateTextResult = class {
	constructor(options) {
		this.steps = options.steps;
		this._output = options.output;
		this.totalUsage = options.totalUsage;
	}
	get finalStep() {
		return this.steps[this.steps.length - 1];
	}
	get content() {
		return this.finalStep.content;
	}
	get text() {
		return this.finalStep.text;
	}
	get files() {
		return this.finalStep.files;
	}
	get reasoningText() {
		return this.finalStep.reasoningText;
	}
	get reasoning() {
		return this.finalStep.reasoning;
	}
	get toolCalls() {
		return this.finalStep.toolCalls;
	}
	get staticToolCalls() {
		return this.finalStep.staticToolCalls;
	}
	get dynamicToolCalls() {
		return this.finalStep.dynamicToolCalls;
	}
	get toolResults() {
		return this.finalStep.toolResults;
	}
	get staticToolResults() {
		return this.finalStep.staticToolResults;
	}
	get dynamicToolResults() {
		return this.finalStep.dynamicToolResults;
	}
	get sources() {
		return this.finalStep.sources;
	}
	get finishReason() {
		return this.finalStep.finishReason;
	}
	get rawFinishReason() {
		return this.finalStep.rawFinishReason;
	}
	get warnings() {
		return this.finalStep.warnings;
	}
	get providerMetadata() {
		return this.finalStep.providerMetadata;
	}
	get response() {
		return this.finalStep.response;
	}
	get request() {
		return this.finalStep.request;
	}
	get usage() {
		return this.finalStep.usage;
	}
	get experimental_output() {
		return this.output;
	}
	get output() {
		if (this._output == null) throw new NoOutputGeneratedError();
		return this._output;
	}
};
function asToolCalls(content) {
	const parts = content.filter((part) => part.type === "tool-call");
	if (parts.length === 0) return;
	return parts.map((toolCall) => ({
		toolCallId: toolCall.toolCallId,
		toolName: toolCall.toolName,
		input: toolCall.input
	}));
}
function asContent({ content, toolCalls, toolOutputs, toolApprovalRequests, tools }) {
	const contentParts = [];
	for (const part of content) switch (part.type) {
		case "text":
		case "reasoning":
		case "source":
			contentParts.push(part);
			break;
		case "file":
			contentParts.push({
				type: "file",
				file: new DefaultGeneratedFile(part),
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			});
			break;
		case "tool-call":
			contentParts.push(toolCalls.find((toolCall) => toolCall.toolCallId === part.toolCallId));
			break;
		case "tool-result": {
			const toolCall = toolCalls.find((toolCall2) => toolCall2.toolCallId === part.toolCallId);
			if (toolCall == null) {
				const tool2 = tools == null ? void 0 : tools[part.toolName];
				if (!((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults)) throw new Error(`Tool call ${part.toolCallId} not found.`);
				if (part.isError) contentParts.push({
					type: "tool-error",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: void 0,
					error: part.result,
					providerExecuted: true,
					dynamic: part.dynamic
				});
				else contentParts.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: void 0,
					output: part.result,
					providerExecuted: true,
					dynamic: part.dynamic
				});
				break;
			}
			if (part.isError) contentParts.push({
				type: "tool-error",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: toolCall.input,
				error: part.result,
				providerExecuted: true,
				dynamic: toolCall.dynamic
			});
			else contentParts.push({
				type: "tool-result",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: toolCall.input,
				output: part.result,
				providerExecuted: true,
				dynamic: toolCall.dynamic
			});
			break;
		}
		case "tool-approval-request": {
			const toolCall = toolCalls.find((toolCall2) => toolCall2.toolCallId === part.toolCallId);
			if (toolCall == null) throw new ToolCallNotFoundForApprovalError({
				toolCallId: part.toolCallId,
				approvalId: part.approvalId
			});
			contentParts.push({
				type: "tool-approval-request",
				approvalId: part.approvalId,
				toolCall
			});
			break;
		}
	}
	return [
		...contentParts,
		...toolOutputs,
		...toolApprovalRequests
	];
}
function prepareHeaders(headers, defaultHeaders) {
	const responseHeaders = new Headers(headers != null ? headers : {});
	for (const [key, value] of Object.entries(defaultHeaders)) if (!responseHeaders.has(key)) responseHeaders.set(key, value);
	return responseHeaders;
}
function createTextStreamResponse({ status, statusText, headers, textStream }) {
	return new Response(textStream.pipeThrough(new TextEncoderStream()), {
		status: status != null ? status : 200,
		statusText,
		headers: prepareHeaders(headers, { "content-type": "text/plain; charset=utf-8" })
	});
}
function writeToServerResponse({ response, status, statusText, headers, stream }) {
	const statusCode = status != null ? status : 200;
	if (statusText !== void 0) response.writeHead(statusCode, statusText, headers);
	else response.writeHead(statusCode, headers);
	const reader = stream.getReader();
	const read = async () => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (!response.write(value)) await new Promise((resolve3) => {
					response.once("drain", resolve3);
				});
			}
		} catch (error) {
			throw error;
		} finally {
			response.end();
		}
	};
	read();
}
function pipeTextStreamToResponse({ response, status, statusText, headers, textStream }) {
	writeToServerResponse({
		response,
		status,
		statusText,
		headers: Object.fromEntries(prepareHeaders(headers, { "content-type": "text/plain; charset=utf-8" }).entries()),
		stream: textStream.pipeThrough(new TextEncoderStream())
	});
}
var JsonToSseTransformStream = class extends TransformStream {
	constructor() {
		super({
			transform(part, controller) {
				controller.enqueue(`data: ${JSON.stringify(part)}

`);
			},
			flush(controller) {
				controller.enqueue("data: [DONE]\n\n");
			}
		});
	}
};
var UI_MESSAGE_STREAM_HEADERS = {
	"content-type": "text/event-stream",
	"cache-control": "no-cache",
	connection: "keep-alive",
	"x-vercel-ai-ui-message-stream": "v1",
	"x-accel-buffering": "no"
};
function createUIMessageStreamResponse({ status, statusText, headers, stream, consumeSseStream }) {
	let sseStream = stream.pipeThrough(new JsonToSseTransformStream());
	if (consumeSseStream) {
		const [stream1, stream2] = sseStream.tee();
		sseStream = stream1;
		consumeSseStream({ stream: stream2 });
	}
	return new Response(sseStream.pipeThrough(new TextEncoderStream()), {
		status,
		statusText,
		headers: prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS)
	});
}
function getResponseUIMessageId({ originalMessages, responseMessageId }) {
	if (originalMessages == null) return;
	const lastMessage = originalMessages[originalMessages.length - 1];
	return (lastMessage == null ? void 0 : lastMessage.role) === "assistant" ? lastMessage.id : typeof responseMessageId === "function" ? responseMessageId() : responseMessageId;
}
var uiMessageChunkSchema = lazySchema(() => zodSchema(union([
	strictObject({
		type: literal("text-start"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("text-delta"),
		id: string(),
		delta: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("text-end"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("error"),
		errorText: string()
	}),
	strictObject({
		type: literal("tool-input-start"),
		toolCallId: string(),
		toolName: string(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		dynamic: boolean().optional(),
		title: string().optional()
	}),
	strictObject({
		type: literal("tool-input-delta"),
		toolCallId: string(),
		inputTextDelta: string()
	}),
	strictObject({
		type: literal("tool-input-available"),
		toolCallId: string(),
		toolName: string(),
		input: unknown(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		dynamic: boolean().optional(),
		title: string().optional()
	}),
	strictObject({
		type: literal("tool-input-error"),
		toolCallId: string(),
		toolName: string(),
		input: unknown(),
		providerExecuted: boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		dynamic: boolean().optional(),
		errorText: string(),
		title: string().optional()
	}),
	strictObject({
		type: literal("tool-approval-request"),
		approvalId: string(),
		toolCallId: string()
	}),
	strictObject({
		type: literal("tool-output-available"),
		toolCallId: string(),
		output: unknown(),
		providerExecuted: boolean().optional(),
		dynamic: boolean().optional(),
		preliminary: boolean().optional()
	}),
	strictObject({
		type: literal("tool-output-error"),
		toolCallId: string(),
		errorText: string(),
		providerExecuted: boolean().optional(),
		dynamic: boolean().optional()
	}),
	strictObject({
		type: literal("tool-output-denied"),
		toolCallId: string()
	}),
	strictObject({
		type: literal("reasoning-start"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("reasoning-delta"),
		id: string(),
		delta: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("reasoning-end"),
		id: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("source-url"),
		sourceId: string(),
		url: string(),
		title: string().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("source-document"),
		sourceId: string(),
		mediaType: string(),
		title: string(),
		filename: string().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: literal("file"),
		url: string(),
		mediaType: string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	strictObject({
		type: custom((value) => typeof value === "string" && value.startsWith("data-"), { message: "Type must start with \"data-\"" }),
		id: string().optional(),
		data: unknown(),
		transient: boolean().optional()
	}),
	strictObject({ type: literal("start-step") }),
	strictObject({ type: literal("finish-step") }),
	strictObject({
		type: literal("start"),
		messageId: string().optional(),
		messageMetadata: unknown().optional()
	}),
	strictObject({
		type: literal("finish"),
		finishReason: _enum([
			"stop",
			"length",
			"content-filter",
			"tool-calls",
			"error",
			"other"
		]).optional(),
		messageMetadata: unknown().optional()
	}),
	strictObject({
		type: literal("abort"),
		reason: string().optional()
	}),
	strictObject({
		type: literal("message-metadata"),
		messageMetadata: unknown()
	})
])));
function isDataUIMessageChunk(chunk) {
	return chunk.type.startsWith("data-");
}
function isDataUIPart(part) {
	return part.type.startsWith("data-");
}
function isTextUIPart(part) {
	return part.type === "text";
}
function isFileUIPart(part) {
	return part.type === "file";
}
function isReasoningUIPart(part) {
	return part.type === "reasoning";
}
function isStaticToolUIPart(part) {
	return part.type.startsWith("tool-");
}
function isDynamicToolUIPart(part) {
	return part.type === "dynamic-tool";
}
function isToolUIPart(part) {
	return isStaticToolUIPart(part) || isDynamicToolUIPart(part);
}
function getStaticToolName(part) {
	return part.type.split("-").slice(1).join("-");
}
function getToolName(part) {
	return isDynamicToolUIPart(part) ? part.toolName : getStaticToolName(part);
}
function createStreamingUIMessageState({ lastMessage, messageId }) {
	return {
		message: (lastMessage == null ? void 0 : lastMessage.role) === "assistant" ? lastMessage : {
			id: messageId,
			metadata: void 0,
			role: "assistant",
			parts: []
		},
		activeTextParts: {},
		activeReasoningParts: {},
		partialToolCalls: {}
	};
}
function processUIMessageStream({ stream, messageMetadataSchema, dataPartSchemas, runUpdateMessageJob, onError, onToolCall, onData }) {
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		await runUpdateMessageJob(async ({ state, write }) => {
			var _a20, _b$3, _c, _d;
			function getToolInvocation(toolCallId) {
				const toolInvocation = state.message.parts.filter(isToolUIPart).find((invocation) => invocation.toolCallId === toolCallId);
				if (toolInvocation == null) throw new UIMessageStreamError({
					chunkType: "tool-invocation",
					chunkId: toolCallId,
					message: `No tool invocation found for tool call ID "${toolCallId}".`
				});
				return toolInvocation;
			}
			function updateToolPart(options) {
				var _a21;
				const part = state.message.parts.find((part2) => isStaticToolUIPart(part2) && part2.toolCallId === options.toolCallId);
				const anyOptions = options;
				const anyPart = part;
				if (part != null) {
					part.state = options.state;
					anyPart.input = anyOptions.input;
					anyPart.output = anyOptions.output;
					anyPart.errorText = anyOptions.errorText;
					anyPart.rawInput = anyOptions.rawInput;
					anyPart.preliminary = anyOptions.preliminary;
					if (options.title !== void 0) anyPart.title = options.title;
					anyPart.providerExecuted = (_a21 = anyOptions.providerExecuted) != null ? _a21 : part.providerExecuted;
					if (anyOptions.providerMetadata != null) part.callProviderMetadata = anyOptions.providerMetadata;
				} else state.message.parts.push({
					type: `tool-${options.toolName}`,
					toolCallId: options.toolCallId,
					state: options.state,
					title: options.title,
					input: anyOptions.input,
					output: anyOptions.output,
					rawInput: anyOptions.rawInput,
					errorText: anyOptions.errorText,
					providerExecuted: anyOptions.providerExecuted,
					preliminary: anyOptions.preliminary,
					...anyOptions.providerMetadata != null ? { callProviderMetadata: anyOptions.providerMetadata } : {}
				});
			}
			function updateDynamicToolPart(options) {
				var _a21, _b2$2;
				const part = state.message.parts.find((part2) => part2.type === "dynamic-tool" && part2.toolCallId === options.toolCallId);
				const anyOptions = options;
				const anyPart = part;
				if (part != null) {
					part.state = options.state;
					anyPart.toolName = options.toolName;
					anyPart.input = anyOptions.input;
					anyPart.output = anyOptions.output;
					anyPart.errorText = anyOptions.errorText;
					anyPart.rawInput = (_a21 = anyOptions.rawInput) != null ? _a21 : anyPart.rawInput;
					anyPart.preliminary = anyOptions.preliminary;
					if (options.title !== void 0) anyPart.title = options.title;
					anyPart.providerExecuted = (_b2$2 = anyOptions.providerExecuted) != null ? _b2$2 : part.providerExecuted;
					if (anyOptions.providerMetadata != null) part.callProviderMetadata = anyOptions.providerMetadata;
				} else state.message.parts.push({
					type: "dynamic-tool",
					toolName: options.toolName,
					toolCallId: options.toolCallId,
					state: options.state,
					input: anyOptions.input,
					output: anyOptions.output,
					errorText: anyOptions.errorText,
					preliminary: anyOptions.preliminary,
					providerExecuted: anyOptions.providerExecuted,
					title: options.title,
					...anyOptions.providerMetadata != null ? { callProviderMetadata: anyOptions.providerMetadata } : {}
				});
			}
			async function updateMessageMetadata(metadata) {
				if (metadata != null) {
					const mergedMetadata = state.message.metadata != null ? mergeObjects(state.message.metadata, metadata) : metadata;
					if (messageMetadataSchema != null) await validateTypes({
						value: mergedMetadata,
						schema: messageMetadataSchema,
						context: {
							field: "message.metadata",
							entityId: state.message.id
						}
					});
					state.message.metadata = mergedMetadata;
				}
			}
			switch (chunk.type) {
				case "text-start": {
					const textPart = {
						type: "text",
						text: "",
						providerMetadata: chunk.providerMetadata,
						state: "streaming"
					};
					state.activeTextParts[chunk.id] = textPart;
					state.message.parts.push(textPart);
					write();
					break;
				}
				case "text-delta": {
					const textPart = state.activeTextParts[chunk.id];
					if (textPart == null) throw new UIMessageStreamError({
						chunkType: "text-delta",
						chunkId: chunk.id,
						message: `Received text-delta for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-delta" chunks.`
					});
					textPart.text += chunk.delta;
					textPart.providerMetadata = (_a20 = chunk.providerMetadata) != null ? _a20 : textPart.providerMetadata;
					write();
					break;
				}
				case "text-end": {
					const textPart = state.activeTextParts[chunk.id];
					if (textPart == null) throw new UIMessageStreamError({
						chunkType: "text-end",
						chunkId: chunk.id,
						message: `Received text-end for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-end" chunks.`
					});
					textPart.state = "done";
					textPart.providerMetadata = (_b$3 = chunk.providerMetadata) != null ? _b$3 : textPart.providerMetadata;
					delete state.activeTextParts[chunk.id];
					write();
					break;
				}
				case "reasoning-start": {
					const reasoningPart = {
						type: "reasoning",
						text: "",
						providerMetadata: chunk.providerMetadata,
						state: "streaming"
					};
					state.activeReasoningParts[chunk.id] = reasoningPart;
					state.message.parts.push(reasoningPart);
					write();
					break;
				}
				case "reasoning-delta": {
					const reasoningPart = state.activeReasoningParts[chunk.id];
					if (reasoningPart == null) throw new UIMessageStreamError({
						chunkType: "reasoning-delta",
						chunkId: chunk.id,
						message: `Received reasoning-delta for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-delta" chunks.`
					});
					reasoningPart.text += chunk.delta;
					reasoningPart.providerMetadata = (_c = chunk.providerMetadata) != null ? _c : reasoningPart.providerMetadata;
					write();
					break;
				}
				case "reasoning-end": {
					const reasoningPart = state.activeReasoningParts[chunk.id];
					if (reasoningPart == null) throw new UIMessageStreamError({
						chunkType: "reasoning-end",
						chunkId: chunk.id,
						message: `Received reasoning-end for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-end" chunks.`
					});
					reasoningPart.providerMetadata = (_d = chunk.providerMetadata) != null ? _d : reasoningPart.providerMetadata;
					reasoningPart.state = "done";
					delete state.activeReasoningParts[chunk.id];
					write();
					break;
				}
				case "file":
					state.message.parts.push({
						type: "file",
						mediaType: chunk.mediaType,
						url: chunk.url
					});
					write();
					break;
				case "source-url":
					state.message.parts.push({
						type: "source-url",
						sourceId: chunk.sourceId,
						url: chunk.url,
						title: chunk.title,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				case "source-document":
					state.message.parts.push({
						type: "source-document",
						sourceId: chunk.sourceId,
						mediaType: chunk.mediaType,
						title: chunk.title,
						filename: chunk.filename,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				case "tool-input-start": {
					const toolInvocations = state.message.parts.filter(isStaticToolUIPart);
					state.partialToolCalls[chunk.toolCallId] = {
						text: "",
						toolName: chunk.toolName,
						index: toolInvocations.length,
						dynamic: chunk.dynamic,
						title: chunk.title
					};
					if (chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-streaming",
						input: void 0,
						providerExecuted: chunk.providerExecuted,
						title: chunk.title,
						providerMetadata: chunk.providerMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-streaming",
						input: void 0,
						providerExecuted: chunk.providerExecuted,
						title: chunk.title,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				}
				case "tool-input-delta": {
					const partialToolCall = state.partialToolCalls[chunk.toolCallId];
					if (partialToolCall == null) throw new UIMessageStreamError({
						chunkType: "tool-input-delta",
						chunkId: chunk.toolCallId,
						message: `Received tool-input-delta for missing tool call with ID "${chunk.toolCallId}". Ensure a "tool-input-start" chunk is sent before any "tool-input-delta" chunks.`
					});
					partialToolCall.text += chunk.inputTextDelta;
					const { value: partialArgs } = await parsePartialJson(partialToolCall.text);
					if (partialToolCall.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: partialToolCall.toolName,
						state: "input-streaming",
						input: partialArgs,
						title: partialToolCall.title
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: partialToolCall.toolName,
						state: "input-streaming",
						input: partialArgs,
						title: partialToolCall.title
					});
					write();
					break;
				}
				case "tool-input-available":
					if (chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-available",
						input: chunk.input,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: chunk.title
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-available",
						input: chunk.input,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: chunk.title
					});
					write();
					if (onToolCall && !chunk.providerExecuted) await onToolCall({ toolCall: chunk });
					break;
				case "tool-input-error":
					if (chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "output-error",
						input: chunk.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "output-error",
						input: void 0,
						rawInput: chunk.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				case "tool-approval-request": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					toolInvocation.state = "approval-requested";
					toolInvocation.approval = { id: chunk.approvalId };
					write();
					break;
				}
				case "tool-output-denied": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					toolInvocation.state = "output-denied";
					write();
					break;
				}
				case "tool-output-available": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					if (toolInvocation.type === "dynamic-tool") updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: toolInvocation.toolName,
						state: "output-available",
						input: toolInvocation.input,
						output: chunk.output,
						preliminary: chunk.preliminary,
						providerExecuted: chunk.providerExecuted,
						title: toolInvocation.title
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: getStaticToolName(toolInvocation),
						state: "output-available",
						input: toolInvocation.input,
						output: chunk.output,
						providerExecuted: chunk.providerExecuted,
						preliminary: chunk.preliminary,
						title: toolInvocation.title
					});
					write();
					break;
				}
				case "tool-output-error": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					if (toolInvocation.type === "dynamic-tool") updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: toolInvocation.toolName,
						state: "output-error",
						input: toolInvocation.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						title: toolInvocation.title
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: getStaticToolName(toolInvocation),
						state: "output-error",
						input: toolInvocation.input,
						rawInput: toolInvocation.rawInput,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						title: toolInvocation.title
					});
					write();
					break;
				}
				case "start-step":
					state.message.parts.push({ type: "step-start" });
					break;
				case "finish-step":
					state.activeTextParts = {};
					state.activeReasoningParts = {};
					break;
				case "start":
					if (chunk.messageId != null) state.message.id = chunk.messageId;
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageId != null || chunk.messageMetadata != null) write();
					break;
				case "finish":
					if (chunk.finishReason != null) state.finishReason = chunk.finishReason;
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageMetadata != null) write();
					break;
				case "message-metadata":
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageMetadata != null) write();
					break;
				case "error":
					onError?.(new Error(chunk.errorText));
					break;
				default: if (isDataUIMessageChunk(chunk)) {
					if ((dataPartSchemas == null ? void 0 : dataPartSchemas[chunk.type]) != null) {
						const partIdx = state.message.parts.findIndex((p) => "id" in p && "data" in p && p.id === chunk.id && p.type === chunk.type);
						const actualPartIdx = partIdx >= 0 ? partIdx : state.message.parts.length;
						await validateTypes({
							value: chunk.data,
							schema: dataPartSchemas[chunk.type],
							context: {
								field: `message.parts[${actualPartIdx}].data`,
								entityName: chunk.type,
								entityId: chunk.id
							}
						});
					}
					const dataChunk = chunk;
					if (dataChunk.transient) {
						onData?.(dataChunk);
						break;
					}
					const existingUIPart = dataChunk.id != null ? state.message.parts.find((chunkArg) => dataChunk.type === chunkArg.type && dataChunk.id === chunkArg.id) : void 0;
					if (existingUIPart != null) existingUIPart.data = dataChunk.data;
					else state.message.parts.push(dataChunk);
					onData?.(dataChunk);
					write();
				}
			}
			controller.enqueue(chunk);
		});
	} }));
}
function handleUIMessageStreamFinish({ messageId, originalMessages = [], onFinish, onError, stream }) {
	let lastMessage = originalMessages == null ? void 0 : originalMessages[originalMessages.length - 1];
	if ((lastMessage == null ? void 0 : lastMessage.role) !== "assistant") lastMessage = void 0;
	else messageId = lastMessage.id;
	let isAborted$1 = false;
	const idInjectedStream = stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		if (chunk.type === "start") {
			const startChunk = chunk;
			if (startChunk.messageId == null && messageId != null) startChunk.messageId = messageId;
		}
		if (chunk.type === "abort") isAborted$1 = true;
		controller.enqueue(chunk);
	} }));
	if (onFinish == null) return idInjectedStream;
	const state = createStreamingUIMessageState({
		lastMessage: lastMessage ? structuredClone(lastMessage) : void 0,
		messageId: messageId != null ? messageId : ""
	});
	const runUpdateMessageJob = async (job) => {
		await job({
			state,
			write: () => {}
		});
	};
	let finishCalled = false;
	const callOnFinish = async () => {
		if (finishCalled || !onFinish) return;
		finishCalled = true;
		const isContinuation = state.message.id === (lastMessage == null ? void 0 : lastMessage.id);
		await onFinish({
			isAborted: isAborted$1,
			isContinuation,
			responseMessage: state.message,
			messages: [...isContinuation ? originalMessages.slice(0, -1) : originalMessages, state.message],
			finishReason: state.finishReason
		});
	};
	return processUIMessageStream({
		stream: idInjectedStream,
		runUpdateMessageJob,
		onError
	}).pipeThrough(new TransformStream({
		transform(chunk, controller) {
			controller.enqueue(chunk);
		},
		async cancel() {
			await callOnFinish();
		},
		async flush() {
			await callOnFinish();
		}
	}));
}
function pipeUIMessageStreamToResponse({ response, status, statusText, headers, stream, consumeSseStream }) {
	let sseStream = stream.pipeThrough(new JsonToSseTransformStream());
	if (consumeSseStream) {
		const [stream1, stream2] = sseStream.tee();
		sseStream = stream1;
		consumeSseStream({ stream: stream2 });
	}
	writeToServerResponse({
		response,
		status,
		statusText,
		headers: Object.fromEntries(prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS).entries()),
		stream: sseStream.pipeThrough(new TextEncoderStream())
	});
}
function createAsyncIterableStream(source) {
	const stream = source.pipeThrough(new TransformStream());
	stream[Symbol.asyncIterator] = function() {
		const reader = this.getReader();
		let finished = false;
		async function cleanup(cancelStream) {
			var _a20;
			if (finished) return;
			finished = true;
			try {
				if (cancelStream) await ((_a20 = reader.cancel) == null ? void 0 : _a20.call(reader));
			} finally {
				try {
					reader.releaseLock();
				} catch (e) {}
			}
		}
		return {
			async next() {
				if (finished) return {
					done: true,
					value: void 0
				};
				const { done, value } = await reader.read();
				if (done) {
					await cleanup(true);
					return {
						done: true,
						value: void 0
					};
				}
				return {
					done: false,
					value
				};
			},
			async return() {
				await cleanup(true);
				return {
					done: true,
					value: void 0
				};
			},
			async throw(err) {
				await cleanup(true);
				throw err;
			}
		};
	};
	return stream;
}
async function consumeStream({ stream, onError }) {
	const reader = stream.getReader();
	try {
		while (true) {
			const { done } = await reader.read();
			if (done) break;
		}
	} catch (error) {
		onError?.(error);
	} finally {
		reader.releaseLock();
	}
}
function createResolvablePromise() {
	let resolve3;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve3 = res;
			reject = rej;
		}),
		resolve: resolve3,
		reject
	};
}
function createStitchableStream() {
	let innerStreamReaders = [];
	let controller = null;
	let isClosed = false;
	let waitForNewStream = createResolvablePromise();
	const terminate = () => {
		isClosed = true;
		waitForNewStream.resolve();
		innerStreamReaders.forEach((reader) => reader.cancel());
		innerStreamReaders = [];
		controller?.close();
	};
	const processPull = async () => {
		if (isClosed && innerStreamReaders.length === 0) {
			controller?.close();
			return;
		}
		if (innerStreamReaders.length === 0) {
			waitForNewStream = createResolvablePromise();
			await waitForNewStream.promise;
			return processPull();
		}
		try {
			const { value, done } = await innerStreamReaders[0].read();
			if (done) {
				innerStreamReaders.shift();
				if (innerStreamReaders.length === 0 && isClosed) controller?.close();
				else await processPull();
			} else controller?.enqueue(value);
		} catch (error) {
			controller?.error(error);
			innerStreamReaders.shift();
			terminate();
		}
	};
	return {
		stream: new ReadableStream({
			start(controllerParam) {
				controller = controllerParam;
			},
			pull: processPull,
			async cancel() {
				for (const reader of innerStreamReaders) await reader.cancel();
				innerStreamReaders = [];
				isClosed = true;
			}
		}),
		addStream: (innerStream) => {
			if (isClosed) throw new Error("Cannot add inner stream: outer stream is closed");
			innerStreamReaders.push(innerStream.getReader());
			waitForNewStream.resolve();
		},
		close: () => {
			isClosed = true;
			waitForNewStream.resolve();
			if (innerStreamReaders.length === 0) controller?.close();
		},
		terminate
	};
}
function now() {
	var _a20, _b$3;
	return (_b$3 = (_a20 = globalThis == null ? void 0 : globalThis.performance) == null ? void 0 : _a20.now()) != null ? _b$3 : Date.now();
}
function runToolsTransformation({ tools, generatorStream, tracer, telemetry, system, messages, abortSignal, repairToolCall, experimental_context, generateId: generateId2 }) {
	let toolResultsStreamController = null;
	const toolResultsStream = new ReadableStream({ start(controller) {
		toolResultsStreamController = controller;
	} });
	const outstandingToolResults = /* @__PURE__ */ new Set();
	const toolInputs = /* @__PURE__ */ new Map();
	const toolCallsByToolCallId = /* @__PURE__ */ new Map();
	let canClose = false;
	let finishChunk = void 0;
	function attemptClose() {
		if (canClose && outstandingToolResults.size === 0) {
			if (finishChunk != null) toolResultsStreamController.enqueue(finishChunk);
			toolResultsStreamController.close();
		}
	}
	const forwardStream = new TransformStream({
		async transform(chunk, controller) {
			const chunkType = chunk.type;
			switch (chunkType) {
				case "stream-start":
				case "text-start":
				case "text-delta":
				case "text-end":
				case "reasoning-start":
				case "reasoning-delta":
				case "reasoning-end":
				case "tool-input-start":
				case "tool-input-delta":
				case "tool-input-end":
				case "source":
				case "response-metadata":
				case "error":
				case "raw":
					controller.enqueue(chunk);
					break;
				case "file":
					controller.enqueue({
						type: "file",
						file: new DefaultGeneratedFileWithType({
							data: chunk.data,
							mediaType: chunk.mediaType
						})
					});
					break;
				case "finish":
					finishChunk = {
						type: "finish",
						finishReason: chunk.finishReason.unified,
						rawFinishReason: chunk.finishReason.raw,
						usage: asLanguageModelUsage(chunk.usage),
						providerMetadata: chunk.providerMetadata
					};
					break;
				case "tool-approval-request": {
					const toolCall = toolCallsByToolCallId.get(chunk.toolCallId);
					if (toolCall == null) {
						toolResultsStreamController.enqueue({
							type: "error",
							error: new ToolCallNotFoundForApprovalError({
								toolCallId: chunk.toolCallId,
								approvalId: chunk.approvalId
							})
						});
						break;
					}
					controller.enqueue({
						type: "tool-approval-request",
						approvalId: chunk.approvalId,
						toolCall
					});
					break;
				}
				case "tool-call":
					try {
						const toolCall = await parseToolCall({
							toolCall: chunk,
							tools,
							repairToolCall,
							system,
							messages
						});
						toolCallsByToolCallId.set(toolCall.toolCallId, toolCall);
						controller.enqueue(toolCall);
						if (toolCall.invalid) {
							toolResultsStreamController.enqueue({
								type: "tool-error",
								toolCallId: toolCall.toolCallId,
								toolName: toolCall.toolName,
								input: toolCall.input,
								error: getErrorMessage(toolCall.error),
								dynamic: true,
								title: toolCall.title
							});
							break;
						}
						const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
						if (tool2 == null) break;
						if (tool2.onInputAvailable != null) await tool2.onInputAvailable({
							input: toolCall.input,
							toolCallId: toolCall.toolCallId,
							messages,
							abortSignal,
							experimental_context
						});
						if (await isApprovalNeeded({
							tool: tool2,
							toolCall,
							messages,
							experimental_context
						})) {
							toolResultsStreamController.enqueue({
								type: "tool-approval-request",
								approvalId: generateId2(),
								toolCall
							});
							break;
						}
						toolInputs.set(toolCall.toolCallId, toolCall.input);
						if (tool2.execute != null && toolCall.providerExecuted !== true) {
							const toolExecutionId = generateId2();
							outstandingToolResults.add(toolExecutionId);
							executeToolCall({
								toolCall,
								tools,
								tracer,
								telemetry,
								messages,
								abortSignal,
								experimental_context,
								onPreliminaryToolResult: (result) => {
									toolResultsStreamController.enqueue(result);
								}
							}).then((result) => {
								toolResultsStreamController.enqueue(result);
							}).catch((error) => {
								toolResultsStreamController.enqueue({
									type: "error",
									error
								});
							}).finally(() => {
								outstandingToolResults.delete(toolExecutionId);
								attemptClose();
							});
						}
					} catch (error) {
						toolResultsStreamController.enqueue({
							type: "error",
							error
						});
					}
					break;
				case "tool-result": {
					const toolName = chunk.toolName;
					if (chunk.isError) toolResultsStreamController.enqueue({
						type: "tool-error",
						toolCallId: chunk.toolCallId,
						toolName,
						input: toolInputs.get(chunk.toolCallId),
						providerExecuted: true,
						error: chunk.result,
						dynamic: chunk.dynamic
					});
					else controller.enqueue({
						type: "tool-result",
						toolCallId: chunk.toolCallId,
						toolName,
						input: toolInputs.get(chunk.toolCallId),
						output: chunk.result,
						providerExecuted: true,
						dynamic: chunk.dynamic
					});
					break;
				}
				default: {
					const _exhaustiveCheck = chunkType;
					throw new Error(`Unhandled chunk type: ${_exhaustiveCheck}`);
				}
			}
		},
		flush() {
			canClose = true;
			attemptClose();
		}
	});
	return new ReadableStream({ async start(controller) {
		return Promise.all([generatorStream.pipeThrough(forwardStream).pipeTo(new WritableStream({
			write(chunk) {
				controller.enqueue(chunk);
			},
			close() {}
		})), toolResultsStream.pipeTo(new WritableStream({
			write(chunk) {
				controller.enqueue(chunk);
			},
			close() {
				controller.close();
			}
		}))]);
	} });
}
var originalGenerateId2 = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
function streamText({ model, tools, toolChoice, system, prompt, messages, maxRetries, abortSignal, timeout, headers, stopWhen = stepCountIs(1), experimental_output, output = experimental_output, experimental_telemetry: telemetry, prepareStep, providerOptions, experimental_activeTools, activeTools = experimental_activeTools, experimental_repairToolCall: repairToolCall, experimental_transform: transform$1, experimental_download: download2, includeRawChunks = false, onChunk, onError = ({ error }) => {
	console.error(error);
}, onFinish, onAbort, onStepFinish, experimental_context, experimental_include: include, _internal: { now: now2 = now, generateId: generateId2 = originalGenerateId2 } = {}, ...settings }) {
	const totalTimeoutMs = getTotalTimeoutMs(timeout);
	const stepTimeoutMs = getStepTimeoutMs(timeout);
	const chunkTimeoutMs = getChunkTimeoutMs(timeout);
	const stepAbortController = stepTimeoutMs != null ? new AbortController() : void 0;
	const chunkAbortController = chunkTimeoutMs != null ? new AbortController() : void 0;
	return new DefaultStreamTextResult({
		model: resolveLanguageModel(model),
		telemetry,
		headers,
		settings,
		maxRetries,
		abortSignal: mergeAbortSignals(abortSignal, totalTimeoutMs != null ? AbortSignal.timeout(totalTimeoutMs) : void 0, stepAbortController == null ? void 0 : stepAbortController.signal, chunkAbortController == null ? void 0 : chunkAbortController.signal),
		stepTimeoutMs,
		stepAbortController,
		chunkTimeoutMs,
		chunkAbortController,
		system,
		prompt,
		messages,
		tools,
		toolChoice,
		transforms: asArray(transform$1),
		activeTools,
		repairToolCall,
		stopConditions: asArray(stopWhen),
		output,
		providerOptions,
		prepareStep,
		includeRawChunks,
		onChunk,
		onError,
		onFinish,
		onAbort,
		onStepFinish,
		now: now2,
		generateId: generateId2,
		experimental_context,
		download: download2,
		include
	});
}
function createOutputTransformStream(output) {
	let firstTextChunkId = void 0;
	let text2 = "";
	let textChunk = "";
	let textProviderMetadata = void 0;
	let lastPublishedJson = "";
	function publishTextChunk({ controller, partialOutput = void 0 }) {
		controller.enqueue({
			part: {
				type: "text-delta",
				id: firstTextChunkId,
				text: textChunk,
				providerMetadata: textProviderMetadata
			},
			partialOutput
		});
		textChunk = "";
	}
	return new TransformStream({ async transform(chunk, controller) {
		var _a20;
		if (chunk.type === "finish-step" && textChunk.length > 0) publishTextChunk({ controller });
		if (chunk.type !== "text-delta" && chunk.type !== "text-start" && chunk.type !== "text-end") {
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		if (firstTextChunkId == null) firstTextChunkId = chunk.id;
		else if (chunk.id !== firstTextChunkId) {
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		if (chunk.type === "text-start") {
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		if (chunk.type === "text-end") {
			if (textChunk.length > 0) publishTextChunk({ controller });
			controller.enqueue({
				part: chunk,
				partialOutput: void 0
			});
			return;
		}
		text2 += chunk.text;
		textChunk += chunk.text;
		textProviderMetadata = (_a20 = chunk.providerMetadata) != null ? _a20 : textProviderMetadata;
		const result = await output.parsePartialOutput({ text: text2 });
		if (result !== void 0) {
			const currentJson = JSON.stringify(result.partial);
			if (currentJson !== lastPublishedJson) {
				publishTextChunk({
					controller,
					partialOutput: result.partial
				});
				lastPublishedJson = currentJson;
			}
		}
	} });
}
var DefaultStreamTextResult = class {
	constructor({ model, telemetry, headers, settings, maxRetries: maxRetriesArg, abortSignal, stepTimeoutMs, stepAbortController, chunkTimeoutMs, chunkAbortController, system, prompt, messages, tools, toolChoice, transforms, activeTools, repairToolCall, stopConditions, output, providerOptions, prepareStep, includeRawChunks, now: now2, generateId: generateId2, onChunk, onError, onFinish, onAbort, onStepFinish, experimental_context, download: download2, include }) {
		this._totalUsage = new DelayedPromise();
		this._finishReason = new DelayedPromise();
		this._rawFinishReason = new DelayedPromise();
		this._steps = new DelayedPromise();
		this.outputSpecification = output;
		this.includeRawChunks = includeRawChunks;
		this.tools = tools;
		let stepFinish;
		let recordedContent = [];
		const recordedResponseMessages = [];
		let recordedFinishReason = void 0;
		let recordedRawFinishReason = void 0;
		let recordedTotalUsage = void 0;
		let recordedRequest = {};
		let recordedWarnings = [];
		const recordedSteps = [];
		const pendingDeferredToolCalls = /* @__PURE__ */ new Map();
		let rootSpan;
		let activeTextContent = {};
		let activeReasoningContent = {};
		const eventProcessor = new TransformStream({
			async transform(chunk, controller) {
				var _a20, _b$3, _c, _d;
				controller.enqueue(chunk);
				const { part } = chunk;
				if (part.type === "text-delta" || part.type === "reasoning-delta" || part.type === "source" || part.type === "tool-call" || part.type === "tool-result" || part.type === "tool-input-start" || part.type === "tool-input-delta" || part.type === "raw") await (onChunk == null ? void 0 : onChunk({ chunk: part }));
				if (part.type === "error") await onError({ error: wrapGatewayError(part.error) });
				if (part.type === "text-start") {
					activeTextContent[part.id] = {
						type: "text",
						text: "",
						providerMetadata: part.providerMetadata
					};
					recordedContent.push(activeTextContent[part.id]);
				}
				if (part.type === "text-delta") {
					const activeText = activeTextContent[part.id];
					if (activeText == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `text part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeText.text += part.text;
					activeText.providerMetadata = (_a20 = part.providerMetadata) != null ? _a20 : activeText.providerMetadata;
				}
				if (part.type === "text-end") {
					const activeText = activeTextContent[part.id];
					if (activeText == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `text part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeText.providerMetadata = (_b$3 = part.providerMetadata) != null ? _b$3 : activeText.providerMetadata;
					delete activeTextContent[part.id];
				}
				if (part.type === "reasoning-start") {
					activeReasoningContent[part.id] = {
						type: "reasoning",
						text: "",
						providerMetadata: part.providerMetadata
					};
					recordedContent.push(activeReasoningContent[part.id]);
				}
				if (part.type === "reasoning-delta") {
					const activeReasoning = activeReasoningContent[part.id];
					if (activeReasoning == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `reasoning part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeReasoning.text += part.text;
					activeReasoning.providerMetadata = (_c = part.providerMetadata) != null ? _c : activeReasoning.providerMetadata;
				}
				if (part.type === "reasoning-end") {
					const activeReasoning = activeReasoningContent[part.id];
					if (activeReasoning == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `reasoning part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeReasoning.providerMetadata = (_d = part.providerMetadata) != null ? _d : activeReasoning.providerMetadata;
					delete activeReasoningContent[part.id];
				}
				if (part.type === "file") recordedContent.push({
					type: "file",
					file: part.file
				});
				if (part.type === "source") recordedContent.push(part);
				if (part.type === "tool-call") recordedContent.push(part);
				if (part.type === "tool-result" && !part.preliminary) recordedContent.push(part);
				if (part.type === "tool-approval-request") recordedContent.push(part);
				if (part.type === "tool-error") recordedContent.push(part);
				if (part.type === "start-step") {
					recordedContent = [];
					activeReasoningContent = {};
					activeTextContent = {};
					recordedRequest = part.request;
					recordedWarnings = part.warnings;
				}
				if (part.type === "finish-step") {
					const stepMessages = await toResponseMessages({
						content: recordedContent,
						tools
					});
					const currentStepResult = new DefaultStepResult({
						content: recordedContent,
						finishReason: part.finishReason,
						rawFinishReason: part.rawFinishReason,
						usage: part.usage,
						warnings: recordedWarnings,
						request: recordedRequest,
						response: {
							...part.response,
							messages: [...recordedResponseMessages, ...stepMessages]
						},
						providerMetadata: part.providerMetadata
					});
					await (onStepFinish == null ? void 0 : onStepFinish(currentStepResult));
					logWarnings({
						warnings: recordedWarnings,
						provider: model.provider,
						model: model.modelId
					});
					recordedSteps.push(currentStepResult);
					recordedResponseMessages.push(...stepMessages);
					stepFinish.resolve();
				}
				if (part.type === "finish") {
					recordedTotalUsage = part.totalUsage;
					recordedFinishReason = part.finishReason;
					recordedRawFinishReason = part.rawFinishReason;
				}
			},
			async flush(controller) {
				try {
					if (recordedSteps.length === 0) {
						const error = (abortSignal == null ? void 0 : abortSignal.aborted) ? abortSignal.reason : new NoOutputGeneratedError({ message: "No output generated. Check the stream for errors." });
						self._finishReason.reject(error);
						self._rawFinishReason.reject(error);
						self._totalUsage.reject(error);
						self._steps.reject(error);
						return;
					}
					const finishReason = recordedFinishReason != null ? recordedFinishReason : "other";
					const totalUsage = recordedTotalUsage != null ? recordedTotalUsage : createNullLanguageModelUsage();
					self._finishReason.resolve(finishReason);
					self._rawFinishReason.resolve(recordedRawFinishReason);
					self._totalUsage.resolve(totalUsage);
					self._steps.resolve(recordedSteps);
					const finalStep = recordedSteps[recordedSteps.length - 1];
					await (onFinish == null ? void 0 : onFinish({
						finishReason: finalStep.finishReason,
						rawFinishReason: finalStep.rawFinishReason,
						totalUsage,
						usage: finalStep.usage,
						content: finalStep.content,
						text: finalStep.text,
						reasoningText: finalStep.reasoningText,
						reasoning: finalStep.reasoning,
						files: finalStep.files,
						sources: finalStep.sources,
						toolCalls: finalStep.toolCalls,
						staticToolCalls: finalStep.staticToolCalls,
						dynamicToolCalls: finalStep.dynamicToolCalls,
						toolResults: finalStep.toolResults,
						staticToolResults: finalStep.staticToolResults,
						dynamicToolResults: finalStep.dynamicToolResults,
						request: finalStep.request,
						response: finalStep.response,
						warnings: finalStep.warnings,
						providerMetadata: finalStep.providerMetadata,
						steps: recordedSteps,
						experimental_context
					}));
					rootSpan.setAttributes(await selectTelemetryAttributes({
						telemetry,
						attributes: {
							"ai.response.finishReason": finishReason,
							"ai.response.text": { output: () => finalStep.text },
							"ai.response.toolCalls": { output: () => {
								var _a20;
								return ((_a20 = finalStep.toolCalls) == null ? void 0 : _a20.length) ? JSON.stringify(finalStep.toolCalls) : void 0;
							} },
							"ai.response.providerMetadata": JSON.stringify(finalStep.providerMetadata),
							"ai.usage.inputTokens": totalUsage.inputTokens,
							"ai.usage.outputTokens": totalUsage.outputTokens,
							"ai.usage.totalTokens": totalUsage.totalTokens,
							"ai.usage.reasoningTokens": totalUsage.reasoningTokens,
							"ai.usage.cachedInputTokens": totalUsage.cachedInputTokens
						}
					}));
				} catch (error) {
					controller.error(error);
				} finally {
					rootSpan.end();
				}
			}
		});
		const stitchableStream = createStitchableStream();
		this.addStream = stitchableStream.addStream;
		this.closeStream = stitchableStream.close;
		const reader = stitchableStream.stream.getReader();
		let stream = new ReadableStream({
			async start(controller) {
				controller.enqueue({ type: "start" });
			},
			async pull(controller) {
				function abort() {
					onAbort?.({ steps: recordedSteps });
					controller.enqueue({
						type: "abort",
						...(abortSignal == null ? void 0 : abortSignal.reason) !== void 0 ? { reason: getErrorMessage$1(abortSignal.reason) } : {}
					});
					controller.close();
				}
				try {
					const { done, value } = await reader.read();
					if (done) {
						controller.close();
						return;
					}
					if (abortSignal == null ? void 0 : abortSignal.aborted) {
						abort();
						return;
					}
					controller.enqueue(value);
				} catch (error) {
					if (isAbortError(error) && (abortSignal == null ? void 0 : abortSignal.aborted)) abort();
					else controller.error(error);
				}
			},
			cancel(reason) {
				return stitchableStream.stream.cancel(reason);
			}
		});
		for (const transform$1 of transforms) stream = stream.pipeThrough(transform$1({
			tools,
			stopStream() {
				stitchableStream.terminate();
			}
		}));
		this.baseStream = stream.pipeThrough(createOutputTransformStream(output != null ? output : text())).pipeThrough(eventProcessor);
		const { maxRetries, retry } = prepareRetries({
			maxRetries: maxRetriesArg,
			abortSignal
		});
		const tracer = getTracer(telemetry);
		const callSettings = prepareCallSettings(settings);
		const baseTelemetryAttributes = getBaseTelemetryAttributes({
			model,
			telemetry,
			headers,
			settings: {
				...callSettings,
				maxRetries
			}
		});
		const self = this;
		recordSpan({
			name: "ai.streamText",
			attributes: selectTelemetryAttributes({
				telemetry,
				attributes: {
					...assembleOperationName({
						operationId: "ai.streamText",
						telemetry
					}),
					...baseTelemetryAttributes,
					"ai.prompt": { input: () => JSON.stringify({
						system,
						prompt,
						messages
					}) }
				}
			}),
			tracer,
			endWhenDone: false,
			fn: async (rootSpanArg) => {
				rootSpan = rootSpanArg;
				const initialPrompt = await standardizePrompt({
					system,
					prompt,
					messages
				});
				const initialMessages = initialPrompt.messages;
				const initialResponseMessages = [];
				const { approvedToolApprovals, deniedToolApprovals } = collectToolApprovals({ messages: initialMessages });
				if (deniedToolApprovals.length > 0 || approvedToolApprovals.length > 0) {
					const providerExecutedToolApprovals = [...approvedToolApprovals, ...deniedToolApprovals].filter((toolApproval) => toolApproval.toolCall.providerExecuted);
					const localApprovedToolApprovals = approvedToolApprovals.filter((toolApproval) => !toolApproval.toolCall.providerExecuted);
					const localDeniedToolApprovals = deniedToolApprovals.filter((toolApproval) => !toolApproval.toolCall.providerExecuted);
					const deniedProviderExecutedToolApprovals = deniedToolApprovals.filter((toolApproval) => toolApproval.toolCall.providerExecuted);
					let toolExecutionStepStreamController;
					const toolExecutionStepStream = new ReadableStream({ start(controller) {
						toolExecutionStepStreamController = controller;
					} });
					self.addStream(toolExecutionStepStream);
					try {
						for (const toolApproval of [...localDeniedToolApprovals, ...deniedProviderExecutedToolApprovals]) toolExecutionStepStreamController?.enqueue({
							type: "tool-output-denied",
							toolCallId: toolApproval.toolCall.toolCallId,
							toolName: toolApproval.toolCall.toolName
						});
						const toolOutputs = [];
						await Promise.all(localApprovedToolApprovals.map(async (toolApproval) => {
							const result = await executeToolCall({
								toolCall: toolApproval.toolCall,
								tools,
								tracer,
								telemetry,
								messages: initialMessages,
								abortSignal,
								experimental_context,
								onPreliminaryToolResult: (result2) => {
									toolExecutionStepStreamController?.enqueue(result2);
								}
							});
							if (result != null) {
								toolExecutionStepStreamController?.enqueue(result);
								toolOutputs.push(result);
							}
						}));
						if (providerExecutedToolApprovals.length > 0) initialResponseMessages.push({
							role: "tool",
							content: providerExecutedToolApprovals.map((toolApproval) => ({
								type: "tool-approval-response",
								approvalId: toolApproval.approvalResponse.approvalId,
								approved: toolApproval.approvalResponse.approved,
								reason: toolApproval.approvalResponse.reason,
								providerExecuted: true
							}))
						});
						if (toolOutputs.length > 0 || localDeniedToolApprovals.length > 0) {
							const localToolContent = [];
							for (const output2 of toolOutputs) localToolContent.push({
								type: "tool-result",
								toolCallId: output2.toolCallId,
								toolName: output2.toolName,
								output: await createToolModelOutput({
									toolCallId: output2.toolCallId,
									input: output2.input,
									tool: tools == null ? void 0 : tools[output2.toolName],
									output: output2.type === "tool-result" ? output2.output : output2.error,
									errorMode: output2.type === "tool-error" ? "json" : "none"
								})
							});
							for (const toolApproval of localDeniedToolApprovals) localToolContent.push({
								type: "tool-result",
								toolCallId: toolApproval.toolCall.toolCallId,
								toolName: toolApproval.toolCall.toolName,
								output: {
									type: "execution-denied",
									reason: toolApproval.approvalResponse.reason
								}
							});
							initialResponseMessages.push({
								role: "tool",
								content: localToolContent
							});
						}
					} finally {
						toolExecutionStepStreamController?.close();
					}
				}
				recordedResponseMessages.push(...initialResponseMessages);
				async function streamStep({ currentStep, responseMessages, usage }) {
					var _a20, _b$3, _c, _d, _e, _f, _g;
					const includeRawChunks2 = self.includeRawChunks;
					const stepTimeoutId = stepTimeoutMs != null ? setTimeout(() => stepAbortController.abort(), stepTimeoutMs) : void 0;
					let chunkTimeoutId = void 0;
					function resetChunkTimeout() {
						if (chunkTimeoutMs != null) {
							if (chunkTimeoutId != null) clearTimeout(chunkTimeoutId);
							chunkTimeoutId = setTimeout(() => chunkAbortController.abort(), chunkTimeoutMs);
						}
					}
					function clearChunkTimeout() {
						if (chunkTimeoutId != null) {
							clearTimeout(chunkTimeoutId);
							chunkTimeoutId = void 0;
						}
					}
					function clearStepTimeout() {
						if (stepTimeoutId != null) clearTimeout(stepTimeoutId);
					}
					try {
						stepFinish = new DelayedPromise();
						const stepInputMessages = [...initialMessages, ...responseMessages];
						const prepareStepResult = await (prepareStep == null ? void 0 : prepareStep({
							model,
							steps: recordedSteps,
							stepNumber: recordedSteps.length,
							messages: stepInputMessages,
							experimental_context
						}));
						const stepModel = resolveLanguageModel((_a20 = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _a20 : model);
						const promptMessages = await convertToLanguageModelPrompt({
							prompt: {
								system: (_b$3 = prepareStepResult == null ? void 0 : prepareStepResult.system) != null ? _b$3 : initialPrompt.system,
								messages: (_c = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _c : stepInputMessages
							},
							supportedUrls: await stepModel.supportedUrls,
							download: download2
						});
						const { toolChoice: stepToolChoice, tools: stepTools } = await prepareToolsAndToolChoice({
							tools,
							toolChoice: (_d = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _d : toolChoice,
							activeTools: (_e = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _e : activeTools
						});
						experimental_context = (_f = prepareStepResult == null ? void 0 : prepareStepResult.experimental_context) != null ? _f : experimental_context;
						const stepProviderOptions = mergeObjects(providerOptions, prepareStepResult == null ? void 0 : prepareStepResult.providerOptions);
						const { result: { stream: stream2, response, request }, doStreamSpan, startTimestampMs } = await retry(() => recordSpan({
							name: "ai.streamText.doStream",
							attributes: selectTelemetryAttributes({
								telemetry,
								attributes: {
									...assembleOperationName({
										operationId: "ai.streamText.doStream",
										telemetry
									}),
									...baseTelemetryAttributes,
									"ai.model.provider": stepModel.provider,
									"ai.model.id": stepModel.modelId,
									"ai.prompt.messages": { input: () => stringifyForTelemetry(promptMessages) },
									"ai.prompt.tools": { input: () => stepTools == null ? void 0 : stepTools.map((tool2) => JSON.stringify(tool2)) },
									"ai.prompt.toolChoice": { input: () => stepToolChoice != null ? JSON.stringify(stepToolChoice) : void 0 },
									"gen_ai.system": stepModel.provider,
									"gen_ai.request.model": stepModel.modelId,
									"gen_ai.request.frequency_penalty": callSettings.frequencyPenalty,
									"gen_ai.request.max_tokens": callSettings.maxOutputTokens,
									"gen_ai.request.presence_penalty": callSettings.presencePenalty,
									"gen_ai.request.stop_sequences": callSettings.stopSequences,
									"gen_ai.request.temperature": callSettings.temperature,
									"gen_ai.request.top_k": callSettings.topK,
									"gen_ai.request.top_p": callSettings.topP
								}
							}),
							tracer,
							endWhenDone: false,
							fn: async (doStreamSpan2) => ({
								startTimestampMs: now2(),
								doStreamSpan: doStreamSpan2,
								result: await stepModel.doStream({
									...callSettings,
									tools: stepTools,
									toolChoice: stepToolChoice,
									responseFormat: await (output == null ? void 0 : output.responseFormat),
									prompt: promptMessages,
									providerOptions: stepProviderOptions,
									abortSignal,
									headers,
									includeRawChunks: includeRawChunks2
								})
							})
						}));
						const streamWithToolResults = runToolsTransformation({
							tools,
							generatorStream: stream2,
							tracer,
							telemetry,
							system,
							messages: stepInputMessages,
							repairToolCall,
							abortSignal,
							experimental_context,
							generateId: generateId2
						});
						const stepRequest = ((_g = include == null ? void 0 : include.requestBody) != null ? _g : true) ? request != null ? request : {} : {
							...request,
							body: void 0
						};
						const stepToolCalls = [];
						const stepToolOutputs = [];
						let warnings;
						const activeToolCallToolNames = {};
						let stepFinishReason = "other";
						let stepRawFinishReason = void 0;
						let stepUsage = createNullLanguageModelUsage();
						let stepProviderMetadata;
						let stepFirstChunk = true;
						let stepResponse = {
							id: generateId2(),
							timestamp: /* @__PURE__ */ new Date(),
							modelId: model.modelId
						};
						let activeText = "";
						self.addStream(streamWithToolResults.pipeThrough(new TransformStream({
							async transform(chunk, controller) {
								var _a21, _b2$2, _c2, _d2, _e2;
								resetChunkTimeout();
								if (chunk.type === "stream-start") {
									warnings = chunk.warnings;
									return;
								}
								if (stepFirstChunk) {
									const msToFirstChunk = now2() - startTimestampMs;
									stepFirstChunk = false;
									doStreamSpan.addEvent("ai.stream.firstChunk", { "ai.response.msToFirstChunk": msToFirstChunk });
									doStreamSpan.setAttributes({ "ai.response.msToFirstChunk": msToFirstChunk });
									controller.enqueue({
										type: "start-step",
										request: stepRequest,
										warnings: warnings != null ? warnings : []
									});
								}
								const chunkType = chunk.type;
								switch (chunkType) {
									case "tool-approval-request":
									case "text-start":
									case "text-end":
										controller.enqueue(chunk);
										break;
									case "text-delta":
										if (chunk.delta.length > 0) {
											controller.enqueue({
												type: "text-delta",
												id: chunk.id,
												text: chunk.delta,
												providerMetadata: chunk.providerMetadata
											});
											activeText += chunk.delta;
										}
										break;
									case "reasoning-start":
									case "reasoning-end":
										controller.enqueue(chunk);
										break;
									case "reasoning-delta":
										controller.enqueue({
											type: "reasoning-delta",
											id: chunk.id,
											text: chunk.delta,
											providerMetadata: chunk.providerMetadata
										});
										break;
									case "tool-call":
										controller.enqueue(chunk);
										stepToolCalls.push(chunk);
										break;
									case "tool-result":
										controller.enqueue(chunk);
										if (!chunk.preliminary) stepToolOutputs.push(chunk);
										break;
									case "tool-error":
										controller.enqueue(chunk);
										stepToolOutputs.push(chunk);
										break;
									case "response-metadata":
										stepResponse = {
											id: (_a21 = chunk.id) != null ? _a21 : stepResponse.id,
											timestamp: (_b2$2 = chunk.timestamp) != null ? _b2$2 : stepResponse.timestamp,
											modelId: (_c2 = chunk.modelId) != null ? _c2 : stepResponse.modelId
										};
										break;
									case "finish": {
										stepUsage = chunk.usage;
										stepFinishReason = chunk.finishReason;
										stepRawFinishReason = chunk.rawFinishReason;
										stepProviderMetadata = chunk.providerMetadata;
										const msToFinish = now2() - startTimestampMs;
										doStreamSpan.addEvent("ai.stream.finish");
										doStreamSpan.setAttributes({
											"ai.response.msToFinish": msToFinish,
											"ai.response.avgOutputTokensPerSecond": 1e3 * ((_d2 = stepUsage.outputTokens) != null ? _d2 : 0) / msToFinish
										});
										break;
									}
									case "file":
										controller.enqueue(chunk);
										break;
									case "source":
										controller.enqueue(chunk);
										break;
									case "tool-input-start": {
										activeToolCallToolNames[chunk.id] = chunk.toolName;
										const tool2 = tools == null ? void 0 : tools[chunk.toolName];
										if ((tool2 == null ? void 0 : tool2.onInputStart) != null) await tool2.onInputStart({
											toolCallId: chunk.id,
											messages: stepInputMessages,
											abortSignal,
											experimental_context
										});
										controller.enqueue({
											...chunk,
											dynamic: (_e2 = chunk.dynamic) != null ? _e2 : (tool2 == null ? void 0 : tool2.type) === "dynamic",
											title: tool2 == null ? void 0 : tool2.title
										});
										break;
									}
									case "tool-input-end":
										delete activeToolCallToolNames[chunk.id];
										controller.enqueue(chunk);
										break;
									case "tool-input-delta": {
										const toolName = activeToolCallToolNames[chunk.id];
										const tool2 = tools == null ? void 0 : tools[toolName];
										if ((tool2 == null ? void 0 : tool2.onInputDelta) != null) await tool2.onInputDelta({
											inputTextDelta: chunk.delta,
											toolCallId: chunk.id,
											messages: stepInputMessages,
											abortSignal,
											experimental_context
										});
										controller.enqueue(chunk);
										break;
									}
									case "error":
										controller.enqueue(chunk);
										stepFinishReason = "error";
										break;
									case "raw":
										if (includeRawChunks2) controller.enqueue(chunk);
										break;
									default: {
										const exhaustiveCheck = chunkType;
										throw new Error(`Unknown chunk type: ${exhaustiveCheck}`);
									}
								}
							},
							async flush(controller) {
								const stepToolCallsJson = stepToolCalls.length > 0 ? JSON.stringify(stepToolCalls) : void 0;
								try {
									doStreamSpan.setAttributes(await selectTelemetryAttributes({
										telemetry,
										attributes: {
											"ai.response.finishReason": stepFinishReason,
											"ai.response.text": { output: () => activeText },
											"ai.response.toolCalls": { output: () => stepToolCallsJson },
											"ai.response.id": stepResponse.id,
											"ai.response.model": stepResponse.modelId,
											"ai.response.timestamp": stepResponse.timestamp.toISOString(),
											"ai.response.providerMetadata": JSON.stringify(stepProviderMetadata),
											"ai.usage.inputTokens": stepUsage.inputTokens,
											"ai.usage.outputTokens": stepUsage.outputTokens,
											"ai.usage.totalTokens": stepUsage.totalTokens,
											"ai.usage.reasoningTokens": stepUsage.reasoningTokens,
											"ai.usage.cachedInputTokens": stepUsage.cachedInputTokens,
											"gen_ai.response.finish_reasons": [stepFinishReason],
											"gen_ai.response.id": stepResponse.id,
											"gen_ai.response.model": stepResponse.modelId,
											"gen_ai.usage.input_tokens": stepUsage.inputTokens,
											"gen_ai.usage.output_tokens": stepUsage.outputTokens
										}
									}));
								} catch (error) {} finally {
									doStreamSpan.end();
								}
								controller.enqueue({
									type: "finish-step",
									finishReason: stepFinishReason,
									rawFinishReason: stepRawFinishReason,
									usage: stepUsage,
									providerMetadata: stepProviderMetadata,
									response: {
										...stepResponse,
										headers: response == null ? void 0 : response.headers
									}
								});
								const combinedUsage = addLanguageModelUsage(usage, stepUsage);
								await stepFinish.promise;
								const clientToolCalls = stepToolCalls.filter((toolCall) => toolCall.providerExecuted !== true);
								const clientToolOutputs = stepToolOutputs.filter((toolOutput) => toolOutput.providerExecuted !== true);
								for (const toolCall of stepToolCalls) {
									if (toolCall.providerExecuted !== true) continue;
									const tool2 = tools == null ? void 0 : tools[toolCall.toolName];
									if ((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults) {
										if (!stepToolOutputs.some((output2) => (output2.type === "tool-result" || output2.type === "tool-error") && output2.toolCallId === toolCall.toolCallId)) pendingDeferredToolCalls.set(toolCall.toolCallId, { toolName: toolCall.toolName });
									}
								}
								for (const output2 of stepToolOutputs) if (output2.type === "tool-result" || output2.type === "tool-error") pendingDeferredToolCalls.delete(output2.toolCallId);
								clearStepTimeout();
								clearChunkTimeout();
								if ((clientToolCalls.length > 0 && clientToolOutputs.length === clientToolCalls.length || pendingDeferredToolCalls.size > 0) && !await isStopConditionMet({
									stopConditions,
									steps: recordedSteps
								})) {
									responseMessages.push(...await toResponseMessages({
										content: recordedSteps[recordedSteps.length - 1].content,
										tools
									}));
									try {
										await streamStep({
											currentStep: currentStep + 1,
											responseMessages,
											usage: combinedUsage
										});
									} catch (error) {
										controller.enqueue({
											type: "error",
											error
										});
										self.closeStream();
									}
								} else {
									controller.enqueue({
										type: "finish",
										finishReason: stepFinishReason,
										rawFinishReason: stepRawFinishReason,
										totalUsage: combinedUsage
									});
									self.closeStream();
								}
							}
						})));
					} finally {
						clearStepTimeout();
						clearChunkTimeout();
					}
				}
				await streamStep({
					currentStep: 0,
					responseMessages: initialResponseMessages,
					usage: createNullLanguageModelUsage()
				});
			}
		}).catch((error) => {
			self.addStream(new ReadableStream({ start(controller) {
				controller.enqueue({
					type: "error",
					error
				});
				controller.close();
			} }));
			self.closeStream();
		});
	}
	get steps() {
		this.consumeStream();
		return this._steps.promise;
	}
	get finalStep() {
		return this.steps.then((steps) => steps[steps.length - 1]);
	}
	get content() {
		return this.finalStep.then((step) => step.content);
	}
	get warnings() {
		return this.finalStep.then((step) => step.warnings);
	}
	get providerMetadata() {
		return this.finalStep.then((step) => step.providerMetadata);
	}
	get text() {
		return this.finalStep.then((step) => step.text);
	}
	get reasoningText() {
		return this.finalStep.then((step) => step.reasoningText);
	}
	get reasoning() {
		return this.finalStep.then((step) => step.reasoning);
	}
	get sources() {
		return this.finalStep.then((step) => step.sources);
	}
	get files() {
		return this.finalStep.then((step) => step.files);
	}
	get toolCalls() {
		return this.finalStep.then((step) => step.toolCalls);
	}
	get staticToolCalls() {
		return this.finalStep.then((step) => step.staticToolCalls);
	}
	get dynamicToolCalls() {
		return this.finalStep.then((step) => step.dynamicToolCalls);
	}
	get toolResults() {
		return this.finalStep.then((step) => step.toolResults);
	}
	get staticToolResults() {
		return this.finalStep.then((step) => step.staticToolResults);
	}
	get dynamicToolResults() {
		return this.finalStep.then((step) => step.dynamicToolResults);
	}
	get usage() {
		return this.finalStep.then((step) => step.usage);
	}
	get request() {
		return this.finalStep.then((step) => step.request);
	}
	get response() {
		return this.finalStep.then((step) => step.response);
	}
	get totalUsage() {
		this.consumeStream();
		return this._totalUsage.promise;
	}
	get finishReason() {
		this.consumeStream();
		return this._finishReason.promise;
	}
	get rawFinishReason() {
		this.consumeStream();
		return this._rawFinishReason.promise;
	}
	/**
	* Split out a new stream from the original stream.
	* The original stream is replaced to allow for further splitting,
	* since we do not know how many times the stream will be split.
	*
	* Note: this leads to buffering the stream content on the server.
	* However, the LLM results are expected to be small enough to not cause issues.
	*/
	teeStream() {
		const [stream1, stream2] = this.baseStream.tee();
		this.baseStream = stream2;
		return stream1;
	}
	get textStream() {
		return createAsyncIterableStream(this.teeStream().pipeThrough(new TransformStream({ transform({ part }, controller) {
			if (part.type === "text-delta") controller.enqueue(part.text);
		} })));
	}
	get fullStream() {
		return createAsyncIterableStream(this.teeStream().pipeThrough(new TransformStream({ transform({ part }, controller) {
			controller.enqueue(part);
		} })));
	}
	async consumeStream(options) {
		var _a20;
		try {
			await consumeStream({
				stream: this.fullStream,
				onError: options == null ? void 0 : options.onError
			});
		} catch (error) {
			(_a20 = options == null ? void 0 : options.onError) == null || _a20.call(options, error);
		}
	}
	get experimental_partialOutputStream() {
		return this.partialOutputStream;
	}
	get partialOutputStream() {
		return createAsyncIterableStream(this.teeStream().pipeThrough(new TransformStream({ transform({ partialOutput }, controller) {
			if (partialOutput != null) controller.enqueue(partialOutput);
		} })));
	}
	get elementStream() {
		var _a20, _b$3, _c;
		const transform$1 = (_a20 = this.outputSpecification) == null ? void 0 : _a20.createElementStreamTransform();
		if (transform$1 == null) throw new UnsupportedFunctionalityError({ functionality: `element streams in ${(_c = (_b$3 = this.outputSpecification) == null ? void 0 : _b$3.name) != null ? _c : "text"} mode` });
		return createAsyncIterableStream(this.teeStream().pipeThrough(transform$1));
	}
	get output() {
		return this.finalStep.then((step) => {
			var _a20;
			return ((_a20 = this.outputSpecification) != null ? _a20 : text()).parseCompleteOutput({ text: step.text }, {
				response: step.response,
				usage: step.usage,
				finishReason: step.finishReason
			});
		});
	}
	toUIMessageStream({ originalMessages, generateMessageId, onFinish, messageMetadata, sendReasoning = true, sendSources = false, sendStart = true, sendFinish = true, onError = getErrorMessage$1 } = {}) {
		const responseMessageId = generateMessageId != null ? getResponseUIMessageId({
			originalMessages,
			responseMessageId: generateMessageId
		}) : void 0;
		const isDynamic = (part) => {
			var _a20;
			const tool2 = (_a20 = this.tools) == null ? void 0 : _a20[part.toolName];
			if (tool2 == null) return part.dynamic;
			return (tool2 == null ? void 0 : tool2.type) === "dynamic" ? true : void 0;
		};
		return createAsyncIterableStream(handleUIMessageStreamFinish({
			stream: this.fullStream.pipeThrough(new TransformStream({ transform: async (part, controller) => {
				const messageMetadataValue = messageMetadata == null ? void 0 : messageMetadata({ part });
				const partType = part.type;
				switch (partType) {
					case "text-start":
						controller.enqueue({
							type: "text-start",
							id: part.id,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						break;
					case "text-delta":
						controller.enqueue({
							type: "text-delta",
							id: part.id,
							delta: part.text,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						break;
					case "text-end":
						controller.enqueue({
							type: "text-end",
							id: part.id,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						break;
					case "reasoning-start":
						controller.enqueue({
							type: "reasoning-start",
							id: part.id,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						break;
					case "reasoning-delta":
						if (sendReasoning) controller.enqueue({
							type: "reasoning-delta",
							id: part.id,
							delta: part.text,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						break;
					case "reasoning-end":
						controller.enqueue({
							type: "reasoning-end",
							id: part.id,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						break;
					case "file":
						controller.enqueue({
							type: "file",
							mediaType: part.file.mediaType,
							url: `data:${part.file.mediaType};base64,${part.file.base64}`
						});
						break;
					case "source":
						if (sendSources && part.sourceType === "url") controller.enqueue({
							type: "source-url",
							sourceId: part.id,
							url: part.url,
							title: part.title,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						if (sendSources && part.sourceType === "document") controller.enqueue({
							type: "source-document",
							sourceId: part.id,
							mediaType: part.mediaType,
							title: part.title,
							filename: part.filename,
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
						});
						break;
					case "tool-input-start": {
						const dynamic = isDynamic(part);
						controller.enqueue({
							type: "tool-input-start",
							toolCallId: part.id,
							toolName: part.toolName,
							...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
							...dynamic != null ? { dynamic } : {},
							...part.title != null ? { title: part.title } : {}
						});
						break;
					}
					case "tool-input-delta":
						controller.enqueue({
							type: "tool-input-delta",
							toolCallId: part.id,
							inputTextDelta: part.delta
						});
						break;
					case "tool-call": {
						const dynamic = isDynamic(part);
						if (part.invalid) controller.enqueue({
							type: "tool-input-error",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							input: part.input,
							...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
							...dynamic != null ? { dynamic } : {},
							errorText: onError(part.error),
							...part.title != null ? { title: part.title } : {}
						});
						else controller.enqueue({
							type: "tool-input-available",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							input: part.input,
							...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
							...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
							...dynamic != null ? { dynamic } : {},
							...part.title != null ? { title: part.title } : {}
						});
						break;
					}
					case "tool-approval-request":
						controller.enqueue({
							type: "tool-approval-request",
							approvalId: part.approvalId,
							toolCallId: part.toolCall.toolCallId
						});
						break;
					case "tool-result": {
						const dynamic = isDynamic(part);
						controller.enqueue({
							type: "tool-output-available",
							toolCallId: part.toolCallId,
							output: part.output,
							...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
							...part.preliminary != null ? { preliminary: part.preliminary } : {},
							...dynamic != null ? { dynamic } : {}
						});
						break;
					}
					case "tool-error": {
						const dynamic = isDynamic(part);
						controller.enqueue({
							type: "tool-output-error",
							toolCallId: part.toolCallId,
							errorText: onError(part.error),
							...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
							...dynamic != null ? { dynamic } : {}
						});
						break;
					}
					case "tool-output-denied":
						controller.enqueue({
							type: "tool-output-denied",
							toolCallId: part.toolCallId
						});
						break;
					case "error":
						controller.enqueue({
							type: "error",
							errorText: onError(part.error)
						});
						break;
					case "start-step":
						controller.enqueue({ type: "start-step" });
						break;
					case "finish-step":
						controller.enqueue({ type: "finish-step" });
						break;
					case "start":
						if (sendStart) controller.enqueue({
							type: "start",
							...messageMetadataValue != null ? { messageMetadata: messageMetadataValue } : {},
							...responseMessageId != null ? { messageId: responseMessageId } : {}
						});
						break;
					case "finish":
						if (sendFinish) controller.enqueue({
							type: "finish",
							finishReason: part.finishReason,
							...messageMetadataValue != null ? { messageMetadata: messageMetadataValue } : {}
						});
						break;
					case "abort":
						controller.enqueue(part);
						break;
					case "tool-input-end": break;
					case "raw": break;
					default: {
						const exhaustiveCheck = partType;
						throw new Error(`Unknown chunk type: ${exhaustiveCheck}`);
					}
				}
				if (messageMetadataValue != null && partType !== "start" && partType !== "finish") controller.enqueue({
					type: "message-metadata",
					messageMetadata: messageMetadataValue
				});
			} })),
			messageId: responseMessageId != null ? responseMessageId : generateMessageId == null ? void 0 : generateMessageId(),
			originalMessages,
			onFinish,
			onError
		}));
	}
	pipeUIMessageStreamToResponse(response, { originalMessages, generateMessageId, onFinish, messageMetadata, sendReasoning, sendSources, sendFinish, sendStart, onError, ...init } = {}) {
		pipeUIMessageStreamToResponse({
			response,
			stream: this.toUIMessageStream({
				originalMessages,
				generateMessageId,
				onFinish,
				messageMetadata,
				sendReasoning,
				sendSources,
				sendFinish,
				sendStart,
				onError
			}),
			...init
		});
	}
	pipeTextStreamToResponse(response, init) {
		pipeTextStreamToResponse({
			response,
			textStream: this.textStream,
			...init
		});
	}
	toUIMessageStreamResponse({ originalMessages, generateMessageId, onFinish, messageMetadata, sendReasoning, sendSources, sendFinish, sendStart, onError, ...init } = {}) {
		return createUIMessageStreamResponse({
			stream: this.toUIMessageStream({
				originalMessages,
				generateMessageId,
				onFinish,
				messageMetadata,
				sendReasoning,
				sendSources,
				sendFinish,
				sendStart,
				onError
			}),
			...init
		});
	}
	toTextStreamResponse(init) {
		return createTextStreamResponse({
			textStream: this.textStream,
			...init
		});
	}
};
function createUIMessageStream({ execute, onError = getErrorMessage, originalMessages, onFinish, generateId: generateId2 = generateId }) {
	let controller;
	const ongoingStreamPromises = [];
	const stream = new ReadableStream({ start(controllerArg) {
		controller = controllerArg;
	} });
	function safeEnqueue(data) {
		try {
			controller.enqueue(data);
		} catch (error) {}
	}
	try {
		const result = execute({ writer: {
			write(part) {
				safeEnqueue(part);
			},
			merge(streamArg) {
				ongoingStreamPromises.push((async () => {
					const reader = streamArg.getReader();
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						safeEnqueue(value);
					}
				})().catch((error) => {
					safeEnqueue({
						type: "error",
						errorText: onError(error)
					});
				}));
			},
			onError
		} });
		if (result) ongoingStreamPromises.push(result.catch((error) => {
			safeEnqueue({
				type: "error",
				errorText: onError(error)
			});
		}));
	} catch (error) {
		safeEnqueue({
			type: "error",
			errorText: onError(error)
		});
	}
	new Promise(async (resolve3) => {
		while (ongoingStreamPromises.length > 0) await ongoingStreamPromises.shift();
		resolve3();
	}).finally(() => {
		try {
			controller.close();
		} catch (error) {}
	});
	return handleUIMessageStreamFinish({
		stream,
		messageId: generateId2(),
		originalMessages,
		onFinish,
		onError
	});
}
async function convertToModelMessages(messages, options) {
	const modelMessages = [];
	if (options == null ? void 0 : options.ignoreIncompleteToolCalls) messages = messages.map((message) => ({
		...message,
		parts: message.parts.filter((part) => !isToolUIPart(part) || part.state !== "input-streaming" && part.state !== "input-available")
	}));
	for (const message of messages) switch (message.role) {
		case "system": {
			const textParts = message.parts.filter((part) => part.type === "text");
			const providerMetadata = textParts.reduce((acc, part) => {
				if (part.providerMetadata != null) return {
					...acc,
					...part.providerMetadata
				};
				return acc;
			}, {});
			modelMessages.push({
				role: "system",
				content: textParts.map((part) => part.text).join(""),
				...Object.keys(providerMetadata).length > 0 ? { providerOptions: providerMetadata } : {}
			});
			break;
		}
		case "user":
			modelMessages.push({
				role: "user",
				content: message.parts.map((part) => {
					var _a20;
					if (isTextUIPart(part)) return {
						type: "text",
						text: part.text,
						...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
					};
					if (isFileUIPart(part)) return {
						type: "file",
						mediaType: part.mediaType,
						filename: part.filename,
						data: part.url,
						...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
					};
					if (isDataUIPart(part)) return (_a20 = options == null ? void 0 : options.convertDataPart) == null ? void 0 : _a20.call(options, part);
				}).filter(isNonNullable)
			});
			break;
		case "assistant":
			if (message.parts != null) {
				let block = [];
				async function processBlock() {
					var _a20, _b$3, _c, _d, _e, _f;
					if (block.length === 0) return;
					const content = [];
					for (const part of block) if (isTextUIPart(part)) content.push({
						type: "text",
						text: part.text,
						...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
					});
					else if (isFileUIPart(part)) content.push({
						type: "file",
						mediaType: part.mediaType,
						filename: part.filename,
						data: part.url
					});
					else if (isReasoningUIPart(part)) content.push({
						type: "reasoning",
						text: part.text,
						providerOptions: part.providerMetadata
					});
					else if (isToolUIPart(part)) {
						const toolName = getToolName(part);
						if (part.state !== "input-streaming") {
							content.push({
								type: "tool-call",
								toolCallId: part.toolCallId,
								toolName,
								input: part.state === "output-error" ? (_a20 = part.input) != null ? _a20 : "rawInput" in part ? part.rawInput : void 0 : part.input,
								providerExecuted: part.providerExecuted,
								...part.callProviderMetadata != null ? { providerOptions: part.callProviderMetadata } : {}
							});
							if (part.approval != null) content.push({
								type: "tool-approval-request",
								approvalId: part.approval.id,
								toolCallId: part.toolCallId
							});
							if (part.providerExecuted === true && part.state !== "approval-responded" && (part.state === "output-available" || part.state === "output-error")) content.push({
								type: "tool-result",
								toolCallId: part.toolCallId,
								toolName,
								output: await createToolModelOutput({
									toolCallId: part.toolCallId,
									input: part.input,
									output: part.state === "output-error" ? part.errorText : part.output,
									tool: (_b$3 = options == null ? void 0 : options.tools) == null ? void 0 : _b$3[toolName],
									errorMode: part.state === "output-error" ? "json" : "none"
								}),
								...part.callProviderMetadata != null ? { providerOptions: part.callProviderMetadata } : {}
							});
						}
					} else if (isDataUIPart(part)) {
						const dataPart = (_c = options == null ? void 0 : options.convertDataPart) == null ? void 0 : _c.call(options, part);
						if (dataPart != null) content.push(dataPart);
					} else {
						const _exhaustiveCheck = part;
						throw new Error(`Unsupported part: ${_exhaustiveCheck}`);
					}
					modelMessages.push({
						role: "assistant",
						content
					});
					const toolParts = block.filter((part) => {
						var _a21;
						return isToolUIPart(part) && (part.providerExecuted !== true || ((_a21 = part.approval) == null ? void 0 : _a21.approved) != null);
					});
					if (toolParts.length > 0) {
						const content2 = [];
						for (const toolPart of toolParts) {
							if (((_d = toolPart.approval) == null ? void 0 : _d.approved) != null) content2.push({
								type: "tool-approval-response",
								approvalId: toolPart.approval.id,
								approved: toolPart.approval.approved,
								reason: toolPart.approval.reason,
								providerExecuted: toolPart.providerExecuted
							});
							if (toolPart.providerExecuted === true) continue;
							switch (toolPart.state) {
								case "output-denied":
									content2.push({
										type: "tool-result",
										toolCallId: toolPart.toolCallId,
										toolName: getToolName(toolPart),
										output: {
											type: "error-text",
											value: (_e = toolPart.approval.reason) != null ? _e : "Tool execution denied."
										},
										...toolPart.callProviderMetadata != null ? { providerOptions: toolPart.callProviderMetadata } : {}
									});
									break;
								case "output-error":
								case "output-available": {
									const toolName = getToolName(toolPart);
									content2.push({
										type: "tool-result",
										toolCallId: toolPart.toolCallId,
										toolName,
										output: await createToolModelOutput({
											toolCallId: toolPart.toolCallId,
											input: toolPart.input,
											output: toolPart.state === "output-error" ? toolPart.errorText : toolPart.output,
											tool: (_f = options == null ? void 0 : options.tools) == null ? void 0 : _f[toolName],
											errorMode: toolPart.state === "output-error" ? "text" : "none"
										}),
										...toolPart.callProviderMetadata != null ? { providerOptions: toolPart.callProviderMetadata } : {}
									});
									break;
								}
							}
						}
						if (content2.length > 0) modelMessages.push({
							role: "tool",
							content: content2
						});
					}
					block = [];
				}
				for (const part of message.parts) if (isTextUIPart(part) || isReasoningUIPart(part) || isFileUIPart(part) || isToolUIPart(part) || isDataUIPart(part)) block.push(part);
				else if (part.type === "step-start") await processBlock();
				await processBlock();
				break;
			}
			break;
		default: {
			const _exhaustiveCheck = message.role;
			throw new MessageConversionError({
				originalMessage: message,
				message: `Unsupported role: ${_exhaustiveCheck}`
			});
		}
	}
	return modelMessages;
}
var uiMessagesSchema = lazySchema(() => zodSchema(array$1(object$1({
	id: string(),
	role: _enum([
		"system",
		"user",
		"assistant"
	]),
	metadata: unknown().optional(),
	parts: array$1(union([
		object$1({
			type: literal("text"),
			text: string(),
			state: _enum(["streaming", "done"]).optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("reasoning"),
			text: string(),
			state: _enum(["streaming", "done"]).optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("source-url"),
			sourceId: string(),
			url: string(),
			title: string().optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("source-document"),
			sourceId: string(),
			mediaType: string(),
			title: string(),
			filename: string().optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({
			type: literal("file"),
			mediaType: string(),
			filename: string().optional(),
			url: string(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		object$1({ type: literal("step-start") }),
		object$1({
			type: string().startsWith("data-"),
			id: string().optional(),
			data: unknown()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			state: literal("input-streaming"),
			input: unknown().optional(),
			providerExecuted: boolean().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			output: never().optional(),
			errorText: never().optional(),
			approval: never().optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			state: literal("input-available"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: never().optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			state: literal("approval-requested"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: never().optional(),
				reason: never().optional()
			})
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			state: literal("approval-responded"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: boolean(),
				reason: string().optional()
			})
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			state: literal("output-available"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: unknown(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			preliminary: boolean().optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional()
			}).optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			state: literal("output-error"),
			input: unknown(),
			rawInput: unknown().optional(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: string(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional()
			}).optional()
		}),
		object$1({
			type: literal("dynamic-tool"),
			toolName: string(),
			toolCallId: string(),
			state: literal("output-denied"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(false),
				reason: string().optional()
			})
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			state: literal("input-streaming"),
			providerExecuted: boolean().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			input: unknown().optional(),
			output: never().optional(),
			errorText: never().optional(),
			approval: never().optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			state: literal("input-available"),
			providerExecuted: boolean().optional(),
			input: unknown(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: never().optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			state: literal("approval-requested"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: never().optional(),
				reason: never().optional()
			})
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			state: literal("approval-responded"),
			input: unknown(),
			providerExecuted: boolean().optional(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: boolean(),
				reason: string().optional()
			})
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			state: literal("output-available"),
			providerExecuted: boolean().optional(),
			input: unknown(),
			output: unknown(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			preliminary: boolean().optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional()
			}).optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			state: literal("output-error"),
			providerExecuted: boolean().optional(),
			input: unknown(),
			rawInput: unknown().optional(),
			output: never().optional(),
			errorText: string(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(true),
				reason: string().optional()
			}).optional()
		}),
		object$1({
			type: string().startsWith("tool-"),
			toolCallId: string(),
			state: literal("output-denied"),
			providerExecuted: boolean().optional(),
			input: unknown(),
			output: never().optional(),
			errorText: never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: object$1({
				id: string(),
				approved: literal(false),
				reason: string().optional()
			})
		})
	])).nonempty("Message must contain at least one part")
})).nonempty("Messages array must not be empty")));
var originalGenerateId3 = createIdGenerator({
	prefix: "aiobj",
	size: 24
});
var originalGenerateId4 = createIdGenerator({
	prefix: "aiobj",
	size: 24
});
function getPotentialStartIndex(text2, searchedText) {
	if (searchedText.length === 0) return null;
	const directIndex = text2.indexOf(searchedText);
	if (directIndex !== -1) return directIndex;
	for (let i = text2.length - 1; i >= 0; i--) {
		const suffix = text2.substring(i);
		if (searchedText.startsWith(suffix)) return i;
	}
	return null;
}
function extractReasoningMiddleware({ tagName, separator = "\n", startWithReasoning = false }) {
	const openingTag = `<${tagName}>`;
	const closingTag = `</${tagName}>`;
	return {
		specificationVersion: "v3",
		wrapGenerate: async ({ doGenerate }) => {
			const { content, ...rest } = await doGenerate();
			const transformedContent = [];
			for (const part of content) {
				if (part.type !== "text") {
					transformedContent.push(part);
					continue;
				}
				const text2 = startWithReasoning ? openingTag + part.text : part.text;
				const regexp = new RegExp(`${openingTag}(.*?)${closingTag}`, "gs");
				const matches = Array.from(text2.matchAll(regexp));
				if (!matches.length) {
					transformedContent.push(part);
					continue;
				}
				const reasoningText = matches.map((match) => match[1]).join(separator);
				let textWithoutReasoning = text2;
				for (let i = matches.length - 1; i >= 0; i--) {
					const match = matches[i];
					const beforeMatch = textWithoutReasoning.slice(0, match.index);
					const afterMatch = textWithoutReasoning.slice(match.index + match[0].length);
					textWithoutReasoning = beforeMatch + (beforeMatch.length > 0 && afterMatch.length > 0 ? separator : "") + afterMatch;
				}
				transformedContent.push({
					type: "reasoning",
					text: reasoningText
				});
				transformedContent.push({
					type: "text",
					text: textWithoutReasoning
				});
			}
			return {
				content: transformedContent,
				...rest
			};
		},
		wrapStream: async ({ doStream }) => {
			const { stream, ...rest } = await doStream();
			const reasoningExtractions = {};
			let delayedTextStart;
			return {
				stream: stream.pipeThrough(new TransformStream({ transform: (chunk, controller) => {
					if (chunk.type === "text-start") {
						delayedTextStart = chunk;
						return;
					}
					if (chunk.type === "text-end" && delayedTextStart) {
						controller.enqueue(delayedTextStart);
						delayedTextStart = void 0;
					}
					if (chunk.type !== "text-delta") {
						controller.enqueue(chunk);
						return;
					}
					if (reasoningExtractions[chunk.id] == null) reasoningExtractions[chunk.id] = {
						isFirstReasoning: true,
						isFirstText: true,
						afterSwitch: false,
						isReasoning: startWithReasoning,
						buffer: "",
						idCounter: 0,
						textId: chunk.id
					};
					const activeExtraction = reasoningExtractions[chunk.id];
					activeExtraction.buffer += chunk.delta;
					function publish(text2) {
						if (text2.length > 0) {
							const prefix = activeExtraction.afterSwitch && (activeExtraction.isReasoning ? !activeExtraction.isFirstReasoning : !activeExtraction.isFirstText) ? separator : "";
							if (activeExtraction.isReasoning && (activeExtraction.afterSwitch || activeExtraction.isFirstReasoning)) controller.enqueue({
								type: "reasoning-start",
								id: `reasoning-${activeExtraction.idCounter}`
							});
							if (activeExtraction.isReasoning) controller.enqueue({
								type: "reasoning-delta",
								delta: prefix + text2,
								id: `reasoning-${activeExtraction.idCounter}`
							});
							else {
								if (delayedTextStart) {
									controller.enqueue(delayedTextStart);
									delayedTextStart = void 0;
								}
								controller.enqueue({
									type: "text-delta",
									delta: prefix + text2,
									id: activeExtraction.textId
								});
							}
							activeExtraction.afterSwitch = false;
							if (activeExtraction.isReasoning) activeExtraction.isFirstReasoning = false;
							else activeExtraction.isFirstText = false;
						}
					}
					do {
						const nextTag = activeExtraction.isReasoning ? closingTag : openingTag;
						const startIndex = getPotentialStartIndex(activeExtraction.buffer, nextTag);
						if (startIndex == null) {
							publish(activeExtraction.buffer);
							activeExtraction.buffer = "";
							break;
						}
						publish(activeExtraction.buffer.slice(0, startIndex));
						if (startIndex + nextTag.length <= activeExtraction.buffer.length) {
							activeExtraction.buffer = activeExtraction.buffer.slice(startIndex + nextTag.length);
							if (activeExtraction.isReasoning) controller.enqueue({
								type: "reasoning-end",
								id: `reasoning-${activeExtraction.idCounter++}`
							});
							activeExtraction.isReasoning = !activeExtraction.isReasoning;
							activeExtraction.afterSwitch = true;
						} else {
							activeExtraction.buffer = activeExtraction.buffer.slice(startIndex);
							break;
						}
					} while (true);
				} })),
				...rest
			};
		}
	};
}
var wrapLanguageModel = ({ model, middleware: middlewareArg, modelId, providerId }) => {
	return [...asArray(middlewareArg)].reverse().reduce((wrappedModel, middleware) => {
		return doWrap({
			model: wrappedModel,
			middleware,
			modelId,
			providerId
		});
	}, model);
};
var doWrap = ({ model, middleware: { transformParams, wrapGenerate, wrapStream, overrideProvider, overrideModelId, overrideSupportedUrls }, modelId, providerId }) => {
	var _a20, _b$3, _c;
	async function doTransform({ params, type }) {
		return transformParams ? await transformParams({
			params,
			type,
			model
		}) : params;
	}
	return {
		specificationVersion: "v3",
		provider: (_a20 = providerId != null ? providerId : overrideProvider == null ? void 0 : overrideProvider({ model })) != null ? _a20 : model.provider,
		modelId: (_b$3 = modelId != null ? modelId : overrideModelId == null ? void 0 : overrideModelId({ model })) != null ? _b$3 : model.modelId,
		supportedUrls: (_c = overrideSupportedUrls == null ? void 0 : overrideSupportedUrls({ model })) != null ? _c : model.supportedUrls,
		async doGenerate(params) {
			const transformedParams = await doTransform({
				params,
				type: "generate"
			});
			const doGenerate = async () => model.doGenerate(transformedParams);
			const doStream = async () => model.doStream(transformedParams);
			return wrapGenerate ? wrapGenerate({
				doGenerate,
				doStream,
				params: transformedParams,
				model
			}) : doGenerate();
		},
		async doStream(params) {
			const transformedParams = await doTransform({
				params,
				type: "stream"
			});
			const doGenerate = async () => model.doGenerate(transformedParams);
			const doStream = async () => model.doStream(transformedParams);
			return wrapStream ? wrapStream({
				doGenerate,
				doStream,
				params: transformedParams,
				model
			}) : doStream();
		}
	};
};
var name19 = "AI_NoSuchProviderError";
var marker19 = `vercel.ai.error.${name19}`;
var symbol19 = Symbol.for(marker19);
var _a19;
_a19 = symbol19;

//#endregion
//#region ../node_modules/@databricks/ai-sdk-provider/dist/index.mjs
const chatAgentToolCallSchema = object$1({
	type: literal("function"),
	function: object$1({
		name: string(),
		arguments: string()
	}),
	id: string()
});
const chatAgentAssistantMessageSchema = object$1({
	role: literal("assistant"),
	content: string(),
	id: string(),
	name: string().optional(),
	tool_calls: array$1(chatAgentToolCallSchema).optional()
});
const chatAgentToolMessageSchema = object$1({
	role: literal("tool"),
	name: string(),
	content: string(),
	tool_call_id: string(),
	id: string(),
	attachments: record(string(), unknown()).optional()
});
const chatAgentUserMessageSchema = object$1({
	role: literal("user"),
	content: string(),
	id: string()
});
const chatAgentMessageSchema = discriminatedUnion("role", [
	chatAgentAssistantMessageSchema,
	chatAgentToolMessageSchema,
	chatAgentUserMessageSchema
]);
const chatAgentChunkSchema = object$1({
	id: string(),
	delta: chatAgentMessageSchema
});
const chatAgentResponseSchema = object$1({
	id: string(),
	messages: array$1(chatAgentMessageSchema)
});
const convertChatAgentChunkToMessagePart = (chunk) => {
	const parts = [];
	if (chunk.delta.role === "assistant") {
		if (chunk.delta.content) parts.push({
			type: "text-delta",
			id: chunk.delta.id,
			delta: chunk.delta.content
		});
		chunk.delta.tool_calls?.forEach((toolCall) => {
			parts.push({
				type: "tool-call",
				toolCallId: toolCall.id,
				input: toolCall.function.arguments,
				toolName: toolCall.function.name,
				dynamic: true,
				providerExecuted: true
			});
		});
	} else if (chunk.delta.role === "tool") parts.push({
		type: "tool-result",
		toolCallId: chunk.delta.tool_call_id,
		result: chunk.delta.content,
		toolName: chunk.delta.name ?? "unknown"
	});
	return parts;
};
const convertChatAgentResponseToMessagePart = (response) => {
	const parts = [];
	for (const message of response.messages) if (message.role === "assistant") {
		parts.push({
			type: "text",
			text: message.content
		});
		for (const part of message.tool_calls ?? []) parts.push({
			type: "tool-call",
			toolCallId: part.id,
			input: part.function.arguments,
			toolName: part.function.name,
			dynamic: true,
			providerExecuted: true
		});
	} else if (message.role === "tool") parts.push({
		type: "tool-result",
		toolCallId: message.tool_call_id,
		result: message.content,
		toolName: message.name ?? "unknown"
	});
	return parts;
};
const convertLanguageModelV3PromptToChatAgentResponse = (prompt) => {
	const messages = [];
	let messageIndex = 0;
	for (const msg of prompt) switch (msg.role) {
		case "system": break;
		case "user": {
			const converted = convertUserMessage$1(msg, messageIndex);
			messages.push(converted);
			messageIndex++;
			break;
		}
		case "assistant": {
			const converted = convertAssistantMessage$1(msg, messageIndex);
			messages.push(...converted);
			messageIndex += converted.length;
			break;
		}
		case "tool": {
			const converted = convertToolMessage(msg, messageIndex);
			messages.push(...converted);
			messageIndex += converted.length;
			break;
		}
	}
	return messages;
};
const convertUserMessage$1 = (msg, messageIndex) => {
	return {
		role: "user",
		content: (msg.content ?? []).filter((part) => part.type === "text").map((part) => part.text).join("\n"),
		id: `user-${messageIndex}`
	};
};
const convertAssistantMessage$1 = (msg, startIndex) => {
	const messages = [];
	let messageIndex = startIndex;
	const textContent = (msg.content ?? []).filter((part) => part.type === "text" || part.type === "reasoning").map((part) => part.type === "text" ? part.text : part.text).join("\n");
	const toolCalls = (msg.content ?? []).filter((part) => part.type === "tool-call").map((call) => ({
		type: "function",
		id: call.toolCallId,
		function: {
			name: call.toolName,
			arguments: typeof call.input === "string" ? call.input : JSON.stringify(call.input ?? {})
		}
	}));
	messages.push({
		role: "assistant",
		content: textContent,
		id: `assistant-${messageIndex++}`,
		tool_calls: toolCalls.length > 0 ? toolCalls : void 0
	});
	for (const part of msg.content ?? []) if (part.type === "tool-result") messages.push({
		role: "tool",
		name: part.toolName,
		content: convertToolResultOutput(part.output),
		tool_call_id: part.toolCallId,
		id: `tool-${messageIndex++}`
	});
	return messages;
};
const convertToolMessage = (msg, startIndex) => {
	const messages = [];
	let messageIndex = startIndex;
	for (const part of msg.content ?? []) if (part.type === "tool-result") messages.push({
		role: "tool",
		name: part.toolName,
		content: convertToolResultOutput(part.output),
		tool_call_id: part.toolCallId,
		id: `tool-${messageIndex++}`
	});
	return messages;
};
const convertToolResultOutput = (output) => {
	switch (output.type) {
		case "text":
		case "error-text": return output.value;
		case "json":
		case "error-json": return JSON.stringify(output.value);
		case "content": return output.value.map((p) => p.type === "text" ? p.text : "").filter(Boolean).join("\n");
		default: return "";
	}
};
/**
* Compose an arbitrary number of `DatabricksStreamPartTransformer`s.
*
* The returned function has the exact same signature as a normal transformer,
* but its `out`‑element type is inferred from the **last** transformer you pass
* in.
*
* Runtime behaviour:
*   1️⃣ Call the first transformer with the supplied `parts` and the
*      caller‑provided `last` (usually `null`).
*   2️⃣ Take its `out` and `last` and feed them to the next transformer.
*   3️⃣ …repeat until the last transformer runs.
*   4️⃣ Return the `out`/`last` of that final transformer.
*/
function composeDatabricksStreamPartTransformers(...transformers) {
	return (initialParts, last = null) => {
		let currentParts = initialParts;
		for (const fn of transformers) currentParts = fn(currentParts, last).out;
		return { out: currentParts };
	};
}
/**
* Injects start/end deltas for sequential streams.
*/
const applyDeltaBoundaryTransform = (parts, last) => {
	const out = [];
	const lastDeltaType = maybeGetDeltaType(last);
	for (const incoming of parts) {
		const incomingDeltaType = maybeGetDeltaType(incoming);
		const incomingId = getPartId$1(incoming);
		const lastId = getPartId$1(last);
		if (Boolean(isDeltaPart(last) && isDeltaPart(incoming)) && Boolean(lastDeltaType && incomingDeltaType) && Boolean(lastDeltaType === incomingDeltaType) && Boolean(incomingId && lastId && incomingId === lastId)) {
			out.push(incoming);
			continue;
		}
		if (isDeltaPart(last)) out.push({
			type: `${getDeltaType(last)}-end`,
			id: last.id
		});
		if (isDeltaPart(incoming)) {
			out.push({
				type: `${getDeltaType(incoming)}-start`,
				id: incoming.id
			}, incoming);
			continue;
		}
		out.push(incoming);
	}
	return { out };
};
const isDeltaIsh = (part) => part?.type.startsWith("text-") || part?.type.startsWith("reasoning-") || false;
const maybeGetDeltaType = (part) => {
	if (!isDeltaIsh(part)) return null;
	if (part.type.startsWith("text-")) return "text";
	if (part.type.startsWith("reasoning-")) return "reasoning";
	return null;
};
const getDeltaType = (part) => {
	if (part.type.startsWith("text-")) return "text";
	if (part.type.startsWith("reasoning-")) return "reasoning";
	throw new Error(`Unknown delta type: ${part.type}`);
};
const isDeltaPart = (part) => part?.type === "text-delta" || part?.type === "reasoning-delta";
const getPartId$1 = (part) => {
	if (part && "id" in part) return part.id;
};
/**
* Allows stream transformations to be composed together.
*
* Currently only used to automatically inject start/end
* deltas since the APIs does not supply the necessary events.
*/
const getDatabricksLanguageModelTransformStream = () => {
	let lastChunk = null;
	const deltaEndByTypeAndId = /* @__PURE__ */ new Set();
	const transformerStreamParts = composeDatabricksStreamPartTransformers(applyDeltaBoundaryTransform);
	return new TransformStream({
		transform(chunk, controller) {
			const { out } = transformerStreamParts([chunk], lastChunk);
			out.forEach((transformedChunk) => {
				const group = getDeltaGroup(transformedChunk.type);
				const endKey = makeEndKey(getPartId(transformedChunk), group);
				if (endKey && deltaEndByTypeAndId.has(endKey)) return;
				if (transformedChunk.type === "text-end" || transformedChunk.type === "reasoning-end") {
					/**
					* We register when a delta ends.
					* We rely on response.output_item.done chunks to display non streamed data
					* so we need to deduplicate them with their corresponding delta chunks.
					*/
					const endGroup = getDeltaGroup(transformedChunk.type);
					const key = makeEndKey(getPartId(transformedChunk), endGroup);
					if (key) deltaEndByTypeAndId.add(key);
				}
				controller.enqueue(transformedChunk);
			});
			lastChunk = out[out.length - 1] ?? lastChunk;
		},
		flush(controller) {
			if (lastChunk?.type === "text-delta") controller.enqueue({
				type: "text-end",
				id: lastChunk.id
			});
			if (lastChunk?.type === "reasoning-delta") controller.enqueue({
				type: "reasoning-end",
				id: lastChunk.id
			});
		}
	});
};
const getDeltaGroup = (type) => {
	if (type.startsWith("text-")) return "text";
	if (type.startsWith("reasoning-")) return "reasoning";
	return null;
};
const getPartId = (part) => {
	if ("id" in part) return part.id;
};
const makeEndKey = (id, group) => id && group ? `${group}:${id}` : null;
var DatabricksChatAgentLanguageModel = class {
	specificationVersion = "v3";
	modelId;
	config;
	constructor(modelId, config$1) {
		this.modelId = modelId;
		this.config = config$1;
	}
	get provider() {
		return this.config.provider;
	}
	supportedUrls = {};
	async doGenerate(options) {
		const { value: response } = await postJsonToApi({
			...this.getArgs({
				config: this.config,
				options,
				stream: false,
				modelId: this.modelId
			}),
			successfulResponseHandler: createJsonResponseHandler(chatAgentResponseSchema),
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			})
		});
		return {
			content: convertChatAgentResponseToMessagePart(response),
			finishReason: {
				raw: void 0,
				unified: "stop"
			},
			usage: {
				inputTokens: {
					total: 0,
					noCache: 0,
					cacheRead: 0,
					cacheWrite: 0
				},
				outputTokens: {
					total: 0,
					text: 0,
					reasoning: 0
				}
			},
			warnings: []
		};
	}
	async doStream(options) {
		const networkArgs = this.getArgs({
			config: this.config,
			options,
			stream: true,
			modelId: this.modelId
		});
		const { responseHeaders, value: response } = await postJsonToApi({
			...networkArgs,
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			}),
			successfulResponseHandler: createEventSourceResponseHandler(chatAgentChunkSchema)
		});
		let finishReason = {
			raw: void 0,
			unified: "other"
		};
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings: []
					});
				},
				transform(chunk, controller) {
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = {
							raw: void 0,
							unified: "error"
						};
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const parts = convertChatAgentChunkToMessagePart(chunk.value);
					for (const part of parts) controller.enqueue(part);
				},
				flush(controller) {
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: {
							inputTokens: {
								total: 0,
								noCache: 0,
								cacheRead: 0,
								cacheWrite: 0
							},
							outputTokens: {
								total: 0,
								text: 0,
								reasoning: 0
							}
						}
					});
				}
			})).pipeThrough(getDatabricksLanguageModelTransformStream()),
			request: { body: networkArgs.body },
			response: { headers: responseHeaders }
		};
	}
	getArgs({ config: config$1, options, stream, modelId }) {
		return {
			body: {
				model: modelId,
				stream,
				messages: convertLanguageModelV3PromptToChatAgentResponse(options.prompt)
			},
			url: config$1.url({ path: "/completions" }),
			headers: combineHeaders(config$1.headers(), options.headers),
			fetch: config$1.fetch,
			abortSignal: options.abortSignal
		};
	}
};
/**
* Response schema
*/
const responsesAgentMessageSchema = object$1({
	type: literal("message"),
	role: literal("assistant"),
	id: string(),
	content: array$1(object$1({
		type: literal("output_text"),
		text: string(),
		logprobs: unknown().nullish(),
		annotations: array$1(discriminatedUnion("type", [object$1({
			type: literal("url_citation"),
			start_index: number(),
			end_index: number(),
			url: string(),
			title: string()
		})]))
	}))
});
const responsesAgentFunctionCallSchema = object$1({
	type: literal("function_call"),
	call_id: string(),
	name: string(),
	arguments: string(),
	id: string()
});
const responsesAgentReasoningSchema = object$1({
	type: literal("reasoning"),
	id: string(),
	encrypted_content: string().nullish(),
	summary: array$1(object$1({
		type: literal("summary_text"),
		text: string()
	}))
});
const responsesAgentFunctionCallOutputSchema = object$1({
	type: literal("function_call_output"),
	call_id: string(),
	output: any()
});
const responsesAgentMcpApprovalRequestSchema = object$1({
	type: literal("mcp_approval_request"),
	id: string(),
	name: string(),
	arguments: string(),
	server_label: string()
});
const responsesAgentMcpApprovalResponseSchema = object$1({
	type: literal("mcp_approval_response"),
	id: string().optional(),
	approval_request_id: string(),
	approve: boolean(),
	reason: string().nullish()
});
const responsesAgentOutputItem = discriminatedUnion("type", [
	responsesAgentMessageSchema,
	responsesAgentFunctionCallSchema,
	responsesAgentReasoningSchema,
	responsesAgentFunctionCallOutputSchema,
	responsesAgentMcpApprovalRequestSchema,
	responsesAgentMcpApprovalResponseSchema
]);
const responsesAgentResponseSchema = object$1({
	id: string().optional(),
	created_at: number().optional(),
	error: object$1({
		code: string(),
		message: string()
	}).nullish(),
	model: string().optional(),
	output: array$1(responsesAgentOutputItem),
	incomplete_details: object$1({ reason: string().nullish().optional() }).nullish(),
	usage: object$1({
		input_tokens: number(),
		output_tokens: number(),
		total_tokens: number()
	}).optional()
});
/**
* Chunk schema
*/
const textDeltaChunkSchema = object$1({
	type: literal("response.output_text.delta"),
	item_id: string(),
	delta: string(),
	logprobs: unknown().nullish()
});
const errorChunkSchema = object$1({
	type: literal("error"),
	code: string(),
	message: string(),
	param: string().nullish(),
	sequence_number: number()
});
const simpleErrorChunkSchema = object$1({
	type: _undefined().optional(),
	error: string()
});
const responseOutputItemDoneSchema = object$1({
	type: literal("response.output_item.done"),
	output_index: number(),
	item: responsesAgentOutputItem
});
const responseAnnotationAddedSchema = object$1({
	type: literal("response.output_text.annotation.added"),
	annotation: discriminatedUnion("type", [object$1({
		type: literal("url_citation"),
		url: string(),
		title: string()
	})])
});
const responseReasoningSummaryTextDeltaSchema = object$1({
	type: literal("response.reasoning_summary_text.delta"),
	item_id: string(),
	summary_index: number(),
	delta: string()
});
const responseFunctionCallArgumentsDeltaSchema = object$1({
	type: literal("response.function_call_arguments.delta"),
	item_id: string(),
	delta: string(),
	output_index: number(),
	sequence_number: number()
});
const functionCallOutputChunkSchema = object$1({
	type: literal("function_call_output"),
	call_id: string(),
	output: any()
});
const responsesCompletedSchema = object$1({
	type: literal("responses.completed"),
	response: object$1({
		id: string(),
		status: _enum([
			"completed",
			"failed",
			"in_progress",
			"cancelled",
			"queued",
			"incomplete"
		]).optional(),
		incomplete_details: object$1({ reason: string().nullish().optional() }).nullish(),
		usage: object$1({
			input_tokens: number(),
			output_tokens: number(),
			total_tokens: number()
		})
	})
});
const responsesAgentChunkSchema = union([
	textDeltaChunkSchema,
	responseOutputItemDoneSchema,
	responseAnnotationAddedSchema,
	responseReasoningSummaryTextDeltaSchema,
	responseFunctionCallArgumentsDeltaSchema,
	functionCallOutputChunkSchema,
	errorChunkSchema,
	responsesCompletedSchema,
	simpleErrorChunkSchema
]);
/**
* We use a loose schema for response validation to handle unknown chunks.
*/
const looseResponseAgentChunkSchema = union([responsesAgentChunkSchema, object$1({ type: string() }).loose()]);
const convertResponsesAgentChunkToMessagePart = (chunk, options = { useRemoteToolCalling: false }) => {
	const parts = [];
	if ("error" in chunk) {
		parts.push({
			type: "error",
			error: chunk.error
		});
		return parts;
	}
	switch (chunk.type) {
		case "response.output_text.delta":
			parts.push({
				type: "text-delta",
				id: chunk.item_id,
				delta: chunk.delta,
				providerMetadata: { databricks: { itemId: chunk.item_id } }
			});
			break;
		case "response.reasoning_summary_text.delta":
			parts.push({
				type: "reasoning-delta",
				id: chunk.item_id,
				delta: chunk.delta,
				providerMetadata: { databricks: { itemId: chunk.item_id } }
			});
			break;
		case "function_call_output":
			parts.push({
				type: "tool-result",
				toolCallId: chunk.call_id,
				result: chunk.output != null ? chunk.output : {},
				toolName: options.toolNamesByCallId?.get(chunk.call_id) ?? "unknown"
			});
			break;
		case "response.output_item.done":
			parts.push(...convertOutputItemDone(chunk.item, options));
			break;
		case "response.output_text.annotation.added":
			parts.push({
				type: "source",
				url: chunk.annotation.url,
				title: chunk.annotation.title,
				id: randomUUID(),
				sourceType: "url"
			});
			break;
		case "error":
			parts.push({
				type: "error",
				error: chunk
			});
			break;
		default: break;
	}
	return parts;
};
const convertOutputItemDone = (item, options) => {
	switch (item.type) {
		case "message": {
			const firstContent = item.content[0];
			if (!firstContent) return [];
			return [{
				type: "text-delta",
				id: item.id,
				delta: firstContent.text,
				providerMetadata: { databricks: {
					itemId: item.id,
					itemType: "response.output_item.done"
				} }
			}];
		}
		case "function_call": return [{
			type: "tool-call",
			toolCallId: item.call_id,
			toolName: item.name,
			input: item.arguments,
			...options.useRemoteToolCalling && {
				dynamic: true,
				providerExecuted: true
			},
			providerMetadata: { databricks: { itemId: item.id } }
		}];
		case "function_call_output": return [{
			type: "tool-result",
			toolCallId: item.call_id,
			result: item.output != null ? item.output : {},
			toolName: options.toolNamesByCallId?.get(item.call_id) ?? "unknown"
		}];
		case "reasoning": {
			const firstSummary = item.summary[0];
			if (!firstSummary) return [];
			return [
				{
					type: "reasoning-start",
					id: item.id
				},
				{
					type: "reasoning-delta",
					id: item.id,
					delta: firstSummary.text,
					providerMetadata: { databricks: { itemId: item.id } }
				},
				{
					type: "reasoning-end",
					id: item.id
				}
			];
		}
		case "mcp_approval_request": return [{
			type: "tool-call",
			toolCallId: item.id,
			toolName: item.name,
			input: item.arguments,
			providerExecuted: true,
			dynamic: true,
			providerMetadata: { databricks: {
				itemId: item.id,
				serverLabel: item.server_label,
				approvalRequestId: item.id
			} }
		}, {
			type: "tool-approval-request",
			approvalId: item.id,
			toolCallId: item.id
		}];
		case "mcp_approval_response": return [{
			type: "tool-result",
			toolCallId: item.approval_request_id,
			toolName: options.toolNamesByCallId?.get(item.approval_request_id) ?? "mcp_approval",
			result: { approved: item.approve },
			providerMetadata: { databricks: { itemId: item.id ?? item.approval_request_id } }
		}];
		default: return [];
	}
};
const convertResponsesAgentResponseToMessagePart = (response, options = { useRemoteToolCalling: false }) => {
	const parts = [];
	const toolNamesByCallId = /* @__PURE__ */ new Map();
	for (const output of response.output) if (output.type === "function_call") toolNamesByCallId.set(output.call_id, output.name);
	else if (output.type === "mcp_approval_request") toolNamesByCallId.set(output.id, output.name);
	for (const output of response.output) switch (output.type) {
		case "message":
			for (const content of output.content) if (content.type === "output_text") parts.push({
				type: "text",
				text: content.text,
				providerMetadata: { databricks: { itemId: output.id } }
			});
			break;
		case "function_call":
			parts.push({
				type: "tool-call",
				toolCallId: output.call_id,
				toolName: output.name,
				input: output.arguments,
				...options.useRemoteToolCalling && {
					dynamic: true,
					providerExecuted: true
				},
				providerMetadata: { databricks: { itemId: output.id } }
			});
			break;
		case "reasoning":
			for (const summary of output.summary) if (summary.type === "summary_text") parts.push({
				type: "reasoning",
				text: summary.text,
				providerMetadata: { databricks: { itemId: output.id } }
			});
			break;
		case "function_call_output":
			parts.push({
				type: "tool-result",
				result: output.output,
				toolCallId: output.call_id,
				toolName: toolNamesByCallId.get(output.call_id) ?? "unknown"
			});
			break;
		case "mcp_approval_request":
			parts.push({
				type: "tool-call",
				toolCallId: output.id,
				toolName: output.name,
				input: output.arguments,
				providerExecuted: true,
				dynamic: true,
				providerMetadata: { databricks: {
					itemId: output.id,
					serverLabel: output.server_label,
					approvalRequestId: output.id
				} }
			});
			parts.push({
				type: "tool-approval-request",
				approvalId: output.id,
				toolCallId: output.id
			});
			break;
		case "mcp_approval_response":
			parts.push({
				type: "tool-result",
				toolCallId: output.approval_request_id,
				toolName: toolNamesByCallId.get(output.approval_request_id) ?? "mcp_approval",
				result: { approved: output.approve },
				providerMetadata: { databricks: { itemId: output.id ?? output.approval_request_id } }
			});
			break;
		default: break;
	}
	return parts;
};
async function convertToResponsesInput({ prompt, systemMessageMode }) {
	const input = [];
	const warnings = [];
	const processedApprovalIds = /* @__PURE__ */ new Set();
	const approvalIdsWithToolResult = /* @__PURE__ */ new Set();
	const toolCallResultsByToolCallId = prompt.filter((p) => p.role === "tool").flatMap((p) => p.content).reduce((reduction, toolCallResult) => {
		if (toolCallResult.type === "tool-result") reduction[toolCallResult.toolCallId] = toolCallResult;
		return reduction;
	}, {});
	for (const { role, content } of prompt) switch (role) {
		case "system":
			switch (systemMessageMode) {
				case "system":
					input.push({
						role: "system",
						content
					});
					break;
				case "developer":
					input.push({
						role: "developer",
						content
					});
					break;
				case "remove":
					warnings.push({
						type: "other",
						message: "system messages are removed for this model"
					});
					break;
				default: {
					const _exhaustiveCheck = systemMessageMode;
					throw new Error(`Unsupported system message mode: ${String(_exhaustiveCheck)}`);
				}
			}
			break;
		case "user":
			input.push({
				role: "user",
				content: content.map((part) => {
					switch (part.type) {
						case "text": return {
							type: "input_text",
							text: part.text
						};
						default: throw new UnsupportedFunctionalityError({ functionality: `part ${JSON.stringify(part)}` });
					}
				})
			});
			break;
		case "assistant":
			for (const part of content) {
				const providerOptions = await parseProviderOptions({
					provider: "databricks",
					providerOptions: part.providerOptions,
					schema: ProviderOptionsSchema$1
				});
				const itemId = providerOptions?.itemId ?? void 0;
				switch (part.type) {
					case "text":
						input.push({
							role: "assistant",
							content: [{
								type: "output_text",
								text: part.text
							}],
							id: itemId
						});
						break;
					case "tool-call": {
						const toolName = providerOptions?.toolName ?? part.toolName;
						const approvalRequestId = providerOptions?.approvalRequestId;
						if (approvalRequestId) {
							const serverLabel = providerOptions?.serverLabel ?? "";
							input.push({
								type: "mcp_approval_request",
								id: approvalRequestId,
								name: toolName,
								arguments: JSON.stringify(part.input),
								server_label: serverLabel
							});
							break;
						}
						input.push({
							type: "function_call",
							call_id: part.toolCallId,
							name: toolName,
							arguments: JSON.stringify(part.input),
							id: itemId
						});
						const toolCallResult = toolCallResultsByToolCallId[part.toolCallId];
						if (toolCallResult) input.push({
							type: "function_call_output",
							call_id: part.toolCallId,
							output: convertToolResultOutputToString(toolCallResult.output)
						});
						break;
					}
					case "tool-result":
						input.push({
							type: "function_call_output",
							call_id: part.toolCallId,
							output: convertToolResultOutputToString(part.output)
						});
						approvalIdsWithToolResult.add(part.toolCallId);
						break;
					case "reasoning":
						if (!itemId) break;
						input.push({
							type: "reasoning",
							summary: [{
								type: "summary_text",
								text: part.text
							}],
							id: itemId
						});
						break;
				}
			}
			break;
		case "tool":
			for (const part of content) if (part.type === "tool-approval-response") {
				if (processedApprovalIds.has(part.approvalId)) continue;
				processedApprovalIds.add(part.approvalId);
				if (approvalIdsWithToolResult.has(part.approvalId)) continue;
				input.push({
					type: "mcp_approval_response",
					id: part.approvalId,
					approval_request_id: part.approvalId,
					approve: part.approved,
					...part.reason && { reason: part.reason }
				});
			}
			break;
		default: {
			const _exhaustiveCheck = role;
			throw new Error(`Unsupported role: ${String(_exhaustiveCheck)}`);
		}
	}
	return {
		input,
		warnings
	};
}
const ProviderOptionsSchema$1 = object$1({
	itemId: string().nullish(),
	toolName: string().nullish(),
	serverLabel: string().nullish(),
	approvalRequestId: string().nullish()
});
const convertToolResultOutputToString = (output) => {
	switch (output.type) {
		case "text":
		case "error-text": return output.value;
		case "execution-denied": return output.reason ?? "Execution denied";
		case "json":
		case "error-json":
		case "content": return JSON.stringify(output.value);
	}
};
/**
* Prepare tools for the Responses API format.
* Unlike the chat completions API, the responses API expects function tools
* with name, description, and parameters at the top level (not nested under 'function').
*/
function prepareResponsesTools({ tools, toolChoice }) {
	if (!tools || tools.length === 0) return {
		tools: void 0,
		toolChoice: void 0
	};
	const responsesTools = [];
	for (const tool$1 of tools) {
		if (tool$1.type === "provider") continue;
		responsesTools.push({
			type: "function",
			name: tool$1.name,
			description: tool$1.description,
			parameters: tool$1.inputSchema
		});
	}
	if (responsesTools.length === 0) return {
		tools: void 0,
		toolChoice: void 0
	};
	return {
		tools: responsesTools,
		toolChoice: convertResponsesToolChoice(toolChoice)
	};
}
function convertResponsesToolChoice(toolChoice) {
	if (!toolChoice) return;
	switch (toolChoice.type) {
		case "auto": return "auto";
		case "none": return "none";
		case "required": return "required";
		case "tool": return {
			type: "function",
			name: toolChoice.toolName
		};
		default: return;
	}
}
/**
* Converts AI SDK LanguageModelV3CallOptions to Databricks Responses API body parameters.
*
* Inspired by the getArgs method in:
* https://github.com/vercel/ai/blob/main/packages/openai/src/responses/openai-responses-language-model.ts#L118
*
* Complies with the API described in:
* https://docs.databricks.com/aws/en/machine-learning/foundation-model-apis/api-reference#responses-api-request
*/
function callOptionsToResponsesArgs(options) {
	const warnings = [];
	const databricksOptions = options.providerOptions?.databricks;
	if (options.topK != null) warnings.push({
		type: "unsupported",
		feature: "topK",
		details: "topK is not supported by the Databricks Responses API"
	});
	if (options.presencePenalty != null) warnings.push({
		type: "unsupported",
		feature: "presencePenalty",
		details: "presencePenalty is not supported by the Databricks Responses API"
	});
	if (options.frequencyPenalty != null) warnings.push({
		type: "unsupported",
		feature: "frequencyPenalty",
		details: "frequencyPenalty is not supported by the Databricks Responses API"
	});
	if (options.seed != null) warnings.push({
		type: "unsupported",
		feature: "seed",
		details: "seed is not supported by the Databricks Responses API"
	});
	if (options.stopSequences != null && options.stopSequences.length > 0) warnings.push({
		type: "unsupported",
		feature: "stopSequences",
		details: "stopSequences is not supported by the Databricks Responses API"
	});
	const args = {};
	if (options.maxOutputTokens != null) args.max_output_tokens = options.maxOutputTokens;
	if (options.temperature != null) args.temperature = options.temperature;
	if (options.topP != null) args.top_p = options.topP;
	if (options.responseFormat != null) switch (options.responseFormat.type) {
		case "text":
			args.text = { format: { type: "text" } };
			break;
		case "json":
			if (options.responseFormat.schema != null) args.text = { format: {
				type: "json_schema",
				json_schema: {
					name: options.responseFormat.name ?? "response",
					description: options.responseFormat.description,
					schema: options.responseFormat.schema,
					strict: true
				}
			} };
			else args.text = { format: { type: "json_object" } };
			break;
	}
	if (databricksOptions?.parallelToolCalls != null) args.parallel_tool_calls = databricksOptions.parallelToolCalls;
	if (databricksOptions?.metadata != null) args.metadata = databricksOptions.metadata;
	if (databricksOptions?.reasoning != null) args.reasoning = databricksOptions.reasoning;
	return {
		args,
		warnings
	};
}
function mapResponsesFinishReason({ finishReason, hasToolCalls }) {
	let unified;
	switch (finishReason) {
		case void 0:
		case null:
			unified = hasToolCalls ? "tool-calls" : "stop";
			break;
		case "max_output_tokens":
			unified = "length";
			break;
		case "content_filter":
			unified = "content-filter";
			break;
		default: unified = hasToolCalls ? "tool-calls" : "other";
	}
	return {
		raw: finishReason ?? void 0,
		unified
	};
}
var DatabricksResponsesAgentLanguageModel = class {
	specificationVersion = "v3";
	modelId;
	config;
	constructor(modelId, config$1) {
		this.modelId = modelId;
		this.config = config$1;
	}
	get provider() {
		return this.config.provider;
	}
	supportedUrls = {};
	async doGenerate(options) {
		const { warnings, ...networkArgs } = await this.getArgs({
			config: this.config,
			options,
			stream: false,
			modelId: this.modelId
		});
		const { value: response } = await postJsonToApi({
			...networkArgs,
			successfulResponseHandler: createJsonResponseHandler(responsesAgentResponseSchema),
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			})
		});
		const content = convertResponsesAgentResponseToMessagePart(response);
		const hasToolCalls = content.some((p) => p.type === "tool-call");
		return {
			content,
			finishReason: mapResponsesFinishReason({
				finishReason: response.incomplete_details?.reason,
				hasToolCalls
			}),
			usage: {
				inputTokens: {
					total: response.usage?.input_tokens ?? 0,
					noCache: 0,
					cacheRead: 0,
					cacheWrite: 0
				},
				outputTokens: {
					total: response.usage?.output_tokens ?? 0,
					text: 0,
					reasoning: 0
				}
			},
			warnings
		};
	}
	async doStream(options) {
		const { warnings, ...networkArgs } = await this.getArgs({
			config: this.config,
			options,
			stream: true,
			modelId: this.modelId
		});
		const { responseHeaders, value: response } = await postJsonToApi({
			...networkArgs,
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			}),
			successfulResponseHandler: createEventSourceResponseHandler(looseResponseAgentChunkSchema),
			abortSignal: options.abortSignal
		});
		let finishReason = {
			raw: void 0,
			unified: "stop"
		};
		const usage = {
			inputTokens: {
				total: 0,
				noCache: 0,
				cacheRead: 0,
				cacheWrite: 0
			},
			outputTokens: {
				total: 0,
				text: 0,
				reasoning: 0
			}
		};
		const allParts = [];
		const useRemoteToolCalling = this.config.useRemoteToolCalling ?? false;
		const toolNamesByCallId = /* @__PURE__ */ new Map();
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = {
							raw: void 0,
							unified: "error"
						};
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					if (chunk.value.type === "responses.completed") {
						const hasToolCalls = allParts.some((p) => p.type === "tool-call");
						finishReason = mapResponsesFinishReason({
							finishReason: chunk.value.response.incomplete_details?.reason,
							hasToolCalls
						});
						usage.inputTokens.total = chunk.value.response.usage.input_tokens;
						usage.outputTokens.total = chunk.value.response.usage.output_tokens;
						return;
					}
					if (chunk.value.type === "response.output_item.done" && chunk.value.item.type === "function_call") toolNamesByCallId.set(chunk.value.item.call_id, chunk.value.item.name);
					const parts = convertResponsesAgentChunkToMessagePart(chunk.value, {
						useRemoteToolCalling,
						toolNamesByCallId
					});
					allParts.push(...parts);
					/**
					* Check if the last chunk was a tool result without a tool call
					* This is a special case for MCP approval requests where the tool result
					* is sent in a separate call after the tool call was approved/denied.
					*/
					if (parts.length === 0) return;
					const part = parts[0];
					if (part.type === "tool-result") {
						const matchingToolCallInParts = parts.find((c) => c.type === "tool-call" && c.toolCallId === part.toolCallId);
						const matchingToolCallInStream = allParts.find((c) => c.type === "tool-call" && c.toolCallId === part.toolCallId);
						if (!matchingToolCallInParts && !matchingToolCallInStream) {
							const toolCallFromPreviousMessages = options.prompt.flatMap((message) => {
								if (typeof message.content === "string") return [];
								return message.content.filter((p) => p.type === "tool-call");
							}).find((p) => p.toolCallId === part.toolCallId);
							if (!toolCallFromPreviousMessages) throw new Error("No matching tool call found in previous message");
							controller.enqueue({
								type: "tool-call",
								toolCallId: toolCallFromPreviousMessages.toolCallId,
								toolName: toolCallFromPreviousMessages.toolName,
								input: JSON.stringify(toolCallFromPreviousMessages.input),
								providerExecuted: true,
								dynamic: true
							});
						}
					}
					if (shouldDedupeOutputItemDone(parts, allParts.slice(0, -parts.length))) return;
					for (const part$1 of parts) controller.enqueue(part$1);
				},
				flush(controller) {
					if (!useRemoteToolCalling) {
						const toolCalls = allParts.filter((p) => p.type === "tool-call");
						const toolResults = allParts.filter((p) => p.type === "tool-result");
						for (const toolCall of toolCalls) {
							if (toolCall.providerMetadata?.databricks?.approvalRequestId != null) continue;
							if (!toolResults.some((r) => r.toolCallId === toolCall.toolCallId)) controller.enqueue({
								...toolCall,
								providerExecuted: true,
								dynamic: true
							});
						}
					}
					controller.enqueue({
						type: "finish",
						finishReason,
						usage
					});
				}
			})).pipeThrough(getDatabricksLanguageModelTransformStream()),
			request: { body: networkArgs.body },
			response: { headers: responseHeaders }
		};
	}
	async getArgs({ config: config$1, options, stream, modelId }) {
		const { input } = await convertToResponsesInput({
			prompt: options.prompt,
			systemMessageMode: "system"
		});
		const { tools, toolChoice } = prepareResponsesTools({
			tools: options.tools,
			toolChoice: options.toolChoice
		});
		const { args: callArgs, warnings } = callOptionsToResponsesArgs(options);
		return {
			url: config$1.url({ path: "/responses" }),
			headers: combineHeaders(config$1.headers(), options.headers),
			body: {
				model: modelId,
				input,
				stream,
				...tools ? { tools } : {},
				...toolChoice && tools ? { tool_choice: toolChoice } : {},
				...callArgs
			},
			warnings,
			fetch: config$1.fetch
		};
	}
};
function shouldDedupeOutputItemDone(incomingParts, previousParts) {
	const doneTextDelta = incomingParts.find((p) => p.type === "text-delta" && p.providerMetadata?.databricks?.itemType === "response.output_item.done");
	if (!doneTextDelta || doneTextDelta.type !== "text-delta" || !doneTextDelta.id) return false;
	/**
	* To determine if the text in response.output_item.done is a duplicate, we need to reconstruct the text from the
	* previous consecutive text-deltas and check if the .done text is already present in what we've streamed.
	*
	* The caveat is that the response.output_item.done text uses GFM footnote syntax, where as the streamed content
	* uses response.output_text.delta and response.output_text.annotation.added events. So we reconstruct all the
	* delta text and check if the .done text is contained in it (meaning we've already streamed it).
	*
	* We only consider text-deltas that came AFTER the last response.output_item.done event, since each .done
	* corresponds to a specific message and we should only compare against text streamed for that message.
	*/
	const lastDoneIndex = previousParts.findLastIndex((part) => part.type === "text-delta" && part.providerMetadata?.databricks?.itemType === "response.output_item.done");
	const { texts: reconstructuredTexts, current } = previousParts.slice(lastDoneIndex + 1).reduce((acc, part) => {
		if (part.type === "text-delta") return {
			...acc,
			current: acc.current + part.delta
		};
		else if (acc.current.trim().length > 0) return {
			texts: [...acc.texts, acc.current.trim()],
			current: ""
		};
		return acc;
	}, {
		texts: [],
		current: ""
	});
	if (current.length > 0) reconstructuredTexts.push(current);
	if (reconstructuredTexts.length === 0) return false;
	return reconstructuredTexts.reduce((acc, text$1) => {
		if (!acc.found) return acc;
		const index = doneTextDelta.delta.indexOf(text$1, acc.lastIndex);
		if (index === -1) return {
			found: false,
			lastIndex: acc.lastIndex
		};
		return {
			found: true,
			lastIndex: index + text$1.length
		};
	}, {
		found: true,
		lastIndex: 0
	}).found;
}
const toolCallSchema = object$1({
	id: string(),
	type: literal("function"),
	function: object$1({
		name: string(),
		arguments: string()
	})
});
const reasoningSummarySchema = discriminatedUnion("type", [object$1({
	type: literal("summary_text"),
	text: string(),
	signature: string().optional()
}), object$1({
	type: literal("summary_encrypted_text"),
	data: string()
})]);
const contentItemSchema = discriminatedUnion("type", [
	object$1({
		type: literal("text"),
		text: string(),
		citation: unknown().optional()
	}),
	object$1({
		type: literal("image"),
		image_url: string()
	}),
	object$1({
		type: literal("reasoning"),
		summary: array$1(reasoningSummarySchema)
	})
]);
const toolCallDeltaSchema = object$1({
	index: number(),
	id: string().optional(),
	type: literal("function").optional(),
	function: object$1({
		name: string().optional(),
		arguments: string().optional()
	}).optional()
});
const fmapiChunkSchema = object$1({
	id: string(),
	created: number(),
	model: string(),
	usage: object$1({
		prompt_tokens: number().nullable().optional(),
		completion_tokens: number().nullable().optional(),
		total_tokens: number().nullable().optional()
	}).nullable().optional(),
	object: literal("chat.completion.chunk"),
	choices: array$1(object$1({
		index: number(),
		delta: object$1({
			role: union([
				literal("assistant"),
				_null(),
				_undefined()
			]).optional(),
			content: union([
				string(),
				array$1(contentItemSchema),
				_null()
			]).optional(),
			tool_calls: array$1(toolCallDeltaSchema).optional()
		}),
		finish_reason: union([string(), _null()]).optional()
	}))
});
const fmapiResponseSchema = object$1({
	id: string(),
	created: number(),
	model: string(),
	usage: object$1({
		prompt_tokens: number(),
		completion_tokens: number(),
		total_tokens: number()
	}).nullable().optional(),
	choices: array$1(object$1({
		message: object$1({
			role: union([
				literal("assistant"),
				literal("user"),
				literal("tool")
			]),
			content: union([
				string(),
				array$1(contentItemSchema),
				_null()
			]).optional(),
			tool_calls: array$1(toolCallSchema).optional()
		}),
		finish_reason: union([string(), _null()]).optional()
	}))
});
const convertFmapiChunkToMessagePart = (chunk, toolCallIdsByIndex) => {
	const parts = [];
	if (chunk.choices.length === 0) return parts;
	const choice$1 = chunk.choices[0];
	if (choice$1.delta.tool_calls && choice$1.delta.tool_calls.length > 0) for (const toolCallDelta of choice$1.delta.tool_calls) {
		const index = toolCallDelta.index;
		if (toolCallDelta.id && toolCallDelta.function?.name) {
			toolCallIdsByIndex?.set(index, toolCallDelta.id);
			parts.push({
				type: "tool-input-start",
				id: toolCallDelta.id,
				toolName: toolCallDelta.function.name
			});
		}
		if (toolCallDelta.function?.arguments) {
			const id = toolCallDelta.id ?? toolCallIdsByIndex?.get(index) ?? `tool-call-${index}`;
			parts.push({
				type: "tool-input-delta",
				id,
				delta: toolCallDelta.function.arguments
			});
		}
	}
	if (typeof choice$1.delta.content === "string") {
		if (choice$1.delta.content) parts.push({
			type: "text-delta",
			id: chunk.id,
			delta: choice$1.delta.content
		});
	} else if (Array.isArray(choice$1.delta.content)) parts.push(...mapContentItemsToStreamParts(choice$1.delta.content, chunk.id));
	return parts;
};
const convertFmapiResponseToMessagePart = (response, options = { useRemoteToolCalling: false }) => {
	const parts = [];
	if (response.choices.length === 0) return parts;
	const choice$1 = response.choices[0];
	if (choice$1.message.tool_calls && choice$1.message.tool_calls.length > 0) {
		for (const toolCall of choice$1.message.tool_calls) parts.push(convertToolCallToContent(toolCall, options));
		if (typeof choice$1.message.content === "string" && choice$1.message.content) parts.push({
			type: "text",
			text: choice$1.message.content
		});
		return parts;
	}
	if (typeof choice$1.message.content === "string") parts.push({
		type: "text",
		text: choice$1.message.content
	});
	else parts.push(...mapContentItemsToProviderContent(choice$1.message.content ?? []));
	return parts;
};
const convertToolCallToContent = (toolCall, options) => {
	return {
		type: "tool-call",
		toolCallId: toolCall.id,
		toolName: toolCall.function.name,
		input: toolCall.function.arguments,
		...options.useRemoteToolCalling && {
			dynamic: true,
			providerExecuted: true
		}
	};
};
const mapContentItemsToStreamParts = (items, id) => {
	const parts = [];
	for (const item of items) switch (item.type) {
		case "text":
			parts.push({
				type: "text-delta",
				id,
				delta: item.text
			});
			break;
		case "image": break;
		case "reasoning":
			for (const summary of item.summary.filter((s) => s.type === "summary_text")) parts.push({
				type: "reasoning-delta",
				id,
				delta: summary.text
			});
			break;
	}
	return parts;
};
const mapContentItemsToProviderContent = (items) => {
	const parts = [];
	for (const item of items) switch (item.type) {
		case "text":
			parts.push({
				type: "text",
				text: item.text
			});
			break;
		case "image": break;
		case "reasoning":
			for (const summary of item.summary.filter((s) => s.type === "summary_text")) parts.push({
				type: "reasoning",
				text: summary.text
			});
			break;
	}
	return parts;
};
const convertPromptToFmapiMessages = async (prompt) => {
	const messages = [];
	for (const message of prompt) switch (message.role) {
		case "system":
			messages.push(convertSystemMessage(message));
			break;
		case "user":
			messages.push(convertUserMessage(message));
			break;
		case "assistant":
			messages.push(await convertAssistantMessage(message));
			break;
		case "tool":
			messages.push(...convertToolMessages(message));
			break;
	}
	return { messages };
};
const convertSystemMessage = (message) => {
	return {
		role: "system",
		content: [{
			type: "text",
			text: message.content
		}]
	};
};
const convertUserMessage = (message) => {
	const content = [];
	for (const part of message.content) switch (part.type) {
		case "text":
			content.push({
				type: "text",
				text: part.text
			});
			break;
		case "file":
			if (part.mediaType.startsWith("image/")) {
				const url = toHttpUrlString(part.data);
				if (url) content.push({
					type: "image",
					image_url: url
				});
			}
			break;
	}
	return {
		role: "user",
		content
	};
};
const convertAssistantMessage = async (message) => {
	const contentItems = [];
	const toolCalls = [];
	for (const part of message.content) switch (part.type) {
		case "text":
			contentItems.push({
				type: "text",
				text: part.text
			});
			break;
		case "file":
			if (part.mediaType.startsWith("image/")) {
				const url = toHttpUrlString(part.data);
				if (url) contentItems.push({
					type: "image",
					image_url: url
				});
			}
			break;
		case "reasoning":
			contentItems.push({
				type: "reasoning",
				summary: [{
					type: "summary_text",
					text: part.text
				}]
			});
			break;
		case "tool-call": {
			const toolName = await getToolNameFromPart(part);
			toolCalls.push({
				id: part.toolCallId,
				type: "function",
				function: {
					name: toolName,
					arguments: typeof part.input === "string" ? part.input : JSON.stringify(part.input)
				}
			});
			break;
		}
	}
	return {
		role: "assistant",
		content: contentItems.length === 0 ? null : contentItems,
		...toolCalls.length > 0 ? { tool_calls: toolCalls } : {}
	};
};
const convertToolMessages = (message) => {
	const messages = [];
	for (const part of message.content) if (part.type === "tool-result") {
		const content = convertToolResultOutputToContentValue(part.output);
		messages.push({
			role: "tool",
			tool_call_id: part.toolCallId,
			content: typeof content === "string" ? content : JSON.stringify(content)
		});
	}
	return messages;
};
const toHttpUrlString = (data) => {
	if (data instanceof URL) return data.toString();
	if (typeof data === "string") {
		if (data.startsWith("http://") || data.startsWith("https://")) return data;
	}
	return null;
};
const convertToolResultOutputToContentValue = (output) => {
	switch (output.type) {
		case "text":
		case "error-text": return output.value;
		case "json":
		case "error-json": return output.value;
		case "content": return output.value;
		default: return null;
	}
};
const ProviderOptionsSchema = object$1({ toolName: string().nullish() });
const getToolNameFromPart = async (part) => {
	return (await parseProviderOptions({
		provider: "databricks",
		providerOptions: part.providerOptions,
		schema: ProviderOptionsSchema
	}))?.toolName ?? part.toolName;
};
function mapFmapiFinishReason(finishReason) {
	switch (finishReason) {
		case "stop": return {
			raw: finishReason,
			unified: "stop"
		};
		case "length": return {
			raw: finishReason,
			unified: "length"
		};
		case "content_filter": return {
			raw: finishReason,
			unified: "content-filter"
		};
		case "function_call":
		case "tool_calls": return {
			raw: finishReason,
			unified: "tool-calls"
		};
		default: return {
			raw: finishReason ?? void 0,
			unified: "other"
		};
	}
}
/**
* Converts AI SDK LanguageModelV3CallOptions to Databricks FMAPI body parameters.
*
* Inspired by the getArgs method in:
* https://github.com/vercel/ai/blob/main/packages/openai/src/chat/openai-chat-language-model.ts#L71
*
* Complies with the API described in:
* https://docs.databricks.com/aws/en/machine-learning/foundation-model-apis/api-reference#chat-request
*/
function callOptionsToFmapiArgs(options) {
	const warnings = [];
	const databricksOptions = options.providerOptions?.databricks;
	if (options.presencePenalty != null) warnings.push({
		type: "unsupported",
		feature: "presencePenalty",
		details: "presencePenalty is not supported by the Databricks FMAPI"
	});
	if (options.frequencyPenalty != null) warnings.push({
		type: "unsupported",
		feature: "frequencyPenalty",
		details: "frequencyPenalty is not supported by the Databricks FMAPI"
	});
	if (options.seed != null) warnings.push({
		type: "unsupported",
		feature: "seed",
		details: "seed is not supported by the Databricks FMAPI"
	});
	const args = {};
	if (options.maxOutputTokens != null) args.max_tokens = options.maxOutputTokens;
	if (options.temperature != null) args.temperature = options.temperature;
	if (options.topP != null) args.top_p = options.topP;
	if (options.topK != null) args.top_k = options.topK;
	if (options.stopSequences != null && options.stopSequences.length > 0) args.stop = options.stopSequences;
	if (options.responseFormat != null) switch (options.responseFormat.type) {
		case "text":
			args.response_format = { type: "text" };
			break;
		case "json":
			if (options.responseFormat.schema != null) args.response_format = {
				type: "json_schema",
				json_schema: {
					name: options.responseFormat.name ?? "response",
					description: options.responseFormat.description,
					schema: options.responseFormat.schema,
					strict: true
				}
			};
			else args.response_format = { type: "json_object" };
			break;
	}
	if (databricksOptions?.topK != null) args.top_k = databricksOptions.topK;
	if (databricksOptions?.n != null) args.n = databricksOptions.n;
	if (databricksOptions?.logprobs != null) args.logprobs = databricksOptions.logprobs;
	if (databricksOptions?.topLogprobs != null) args.top_logprobs = databricksOptions.topLogprobs;
	if (databricksOptions?.reasoningEffort != null) args.reasoning_effort = databricksOptions.reasoningEffort;
	return {
		args,
		warnings
	};
}
var DatabricksFmapiLanguageModel = class {
	specificationVersion = "v3";
	modelId;
	config;
	constructor(modelId, config$1) {
		this.modelId = modelId;
		this.config = config$1;
	}
	get provider() {
		return this.config.provider;
	}
	supportedUrls = {};
	async doGenerate(options) {
		const { warnings, ...networkArgs } = await this.getArgs({
			config: this.config,
			options,
			stream: false,
			modelId: this.modelId
		});
		const { value: response } = await postJsonToApi({
			...networkArgs,
			successfulResponseHandler: createJsonResponseHandler(fmapiResponseSchema),
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			})
		});
		const choice$1 = response.choices[0];
		const finishReason = mapFmapiFinishReason(choice$1?.finish_reason);
		return {
			content: convertFmapiResponseToMessagePart(response, { useRemoteToolCalling: this.config.useRemoteToolCalling ?? false }),
			finishReason,
			usage: {
				inputTokens: {
					total: response.usage?.prompt_tokens ?? 0,
					noCache: 0,
					cacheRead: 0,
					cacheWrite: 0
				},
				outputTokens: {
					total: response.usage?.completion_tokens ?? 0,
					text: 0,
					reasoning: 0
				}
			},
			warnings
		};
	}
	async doStream(options) {
		const { warnings, ...networkArgs } = await this.getArgs({
			config: this.config,
			options,
			stream: true,
			modelId: this.modelId
		});
		const { responseHeaders, value: response } = await postJsonToApi({
			...networkArgs,
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			}),
			successfulResponseHandler: createEventSourceResponseHandler(fmapiChunkSchema),
			abortSignal: options.abortSignal
		});
		let finishReason = {
			raw: void 0,
			unified: "other"
		};
		let usage = {
			inputTokens: {
				total: 0,
				noCache: 0,
				cacheRead: 0,
				cacheWrite: 0
			},
			outputTokens: {
				total: 0,
				text: 0,
				reasoning: 0
			}
		};
		const toolCallIdsByIndex = /* @__PURE__ */ new Map();
		const toolCallNamesById = /* @__PURE__ */ new Map();
		const toolCallInputsById = /* @__PURE__ */ new Map();
		const useRemoteToolCalling = this.config.useRemoteToolCalling ?? false;
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = {
							raw: void 0,
							unified: "error"
						};
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const choice$1 = chunk.value.choices[0];
					finishReason = mapFmapiFinishReason(choice$1?.finish_reason);
					if (chunk.value.usage) usage = {
						inputTokens: {
							total: chunk.value.usage.prompt_tokens ?? 0,
							noCache: 0,
							cacheRead: 0,
							cacheWrite: 0
						},
						outputTokens: {
							total: chunk.value.usage.completion_tokens ?? 0,
							text: 0,
							reasoning: 0
						}
					};
					const parts = convertFmapiChunkToMessagePart(chunk.value, toolCallIdsByIndex);
					for (const part of parts) {
						if (part.type === "tool-input-start") {
							toolCallNamesById.set(part.id, part.toolName);
							toolCallInputsById.set(part.id, "");
						} else if (part.type === "tool-input-delta") {
							const current = toolCallInputsById.get(part.id) ?? "";
							toolCallInputsById.set(part.id, current + part.delta);
						}
						controller.enqueue(part);
					}
				},
				flush(controller) {
					for (const [toolCallId, inputText] of toolCallInputsById) {
						const toolName = toolCallNamesById.get(toolCallId);
						if (toolName) {
							controller.enqueue({
								type: "tool-input-end",
								id: toolCallId
							});
							controller.enqueue({
								type: "tool-call",
								toolCallId,
								toolName,
								input: inputText,
								...useRemoteToolCalling && {
									dynamic: true,
									providerExecuted: true
								}
							});
						}
					}
					controller.enqueue({
						type: "finish",
						finishReason,
						usage
					});
				}
			})).pipeThrough(getDatabricksLanguageModelTransformStream()),
			request: { body: networkArgs.body },
			response: { headers: responseHeaders }
		};
	}
	async getArgs({ config: config$1, options, stream, modelId }) {
		const tools = options.tools?.map((tool$1) => convertToolToOpenAIFormat(tool$1)).filter((tool$1) => tool$1 !== void 0);
		const toolChoice = options.toolChoice ? convertToolChoiceToOpenAIFormat(options.toolChoice) : void 0;
		const { messages } = await convertPromptToFmapiMessages(options.prompt);
		const { args: callArgs, warnings } = callOptionsToFmapiArgs(options);
		return {
			url: config$1.url({ path: "/chat/completions" }),
			headers: combineHeaders(config$1.headers(), options.headers),
			body: {
				messages,
				stream,
				model: modelId,
				...tools && tools.length > 0 ? { tools } : {},
				...toolChoice && tools && tools.length > 0 ? { tool_choice: toolChoice } : {},
				...callArgs
			},
			warnings,
			fetch: config$1.fetch
		};
	}
};
/**
* Convert AI SDK tool to OpenAI format
*/
function convertToolToOpenAIFormat(tool$1) {
	if (tool$1.type === "provider") return;
	return {
		type: "function",
		function: {
			name: tool$1.name,
			description: tool$1.description,
			parameters: tool$1.inputSchema
		}
	};
}
/**
* Convert AI SDK tool choice to OpenAI format
*/
function convertToolChoiceToOpenAIFormat(toolChoice) {
	if (toolChoice.type === "auto") return "auto";
	if (toolChoice.type === "none") return "none";
	if (toolChoice.type === "required") return "required";
	if (toolChoice.type === "tool") return {
		type: "function",
		function: { name: toolChoice.toolName }
	};
	return "auto";
}
const createDatabricksProvider = (settings) => {
	const baseUrl = withoutTrailingSlash(settings.baseURL);
	const getHeaders = () => combineHeaders(settings.headers);
	const fetch$1 = settings.fetch;
	const provider = settings.provider ?? "databricks";
	const formatUrl = ({ path }) => settings.formatUrl?.({
		baseUrl,
		path
	}) ?? `${baseUrl}${path}`;
	const createChatAgent = (modelId) => new DatabricksChatAgentLanguageModel(modelId, {
		url: formatUrl,
		headers: getHeaders,
		fetch: fetch$1,
		provider
	});
	const createResponsesAgent = (modelId) => new DatabricksResponsesAgentLanguageModel(modelId, {
		url: formatUrl,
		headers: getHeaders,
		fetch: fetch$1,
		provider,
		useRemoteToolCalling: settings.useRemoteToolCalling
	});
	const createFmapi = (modelId) => new DatabricksFmapiLanguageModel(modelId, {
		url: formatUrl,
		headers: getHeaders,
		fetch: fetch$1,
		provider,
		useRemoteToolCalling: settings.useRemoteToolCalling
	});
	const notImplemented = (name$4) => {
		return () => {
			throw new Error(`${name$4} is not supported yet`);
		};
	};
	return {
		specificationVersion: "v3",
		responses: createResponsesAgent,
		chatCompletions: createFmapi,
		chatAgent: createChatAgent,
		imageModel: notImplemented("ImageModel"),
		textEmbeddingModel: notImplemented("TextEmbeddingModel"),
		embeddingModel: notImplemented("EmbeddingModel"),
		languageModel: notImplemented("LanguageModel")
	};
};

//#endregion
//#region ../packages/ai-sdk-providers/src/request-context.ts
/**
* Utility functions for request context handling.
*/
/**
* Determines whether context should be injected based on endpoint type.
*
* Context is injected when:
* 1. Using API_PROXY environment variable, OR
* 2. Endpoint task type is 'agent/v2/chat' or 'agent/v1/responses'
*
* @param endpointTask - The task type of the serving endpoint (optional)
* @returns Whether to inject context into requests
*/
function shouldInjectContextForEndpoint(endpointTask) {
	if (process.env.API_PROXY) return true;
	return endpointTask === "agent/v2/chat" || endpointTask === "agent/v1/responses";
}

//#endregion
//#region ../packages/ai-sdk-providers/src/providers-server.ts
const CONTEXT_HEADER_CONVERSATION_ID = "x-databricks-conversation-id";
const CONTEXT_HEADER_USER_ID = "x-databricks-user-id";
async function getProviderToken() {
	if (process.env.DATABRICKS_TOKEN) {
		console.log("Using PAT token from DATABRICKS_TOKEN env var");
		return process.env.DATABRICKS_TOKEN;
	}
	return getDatabricksToken();
}
let cachedWorkspaceHostname = null;
async function getWorkspaceHostname() {
	if (cachedWorkspaceHostname) return cachedWorkspaceHostname;
	try {
		if (getAuthMethod() === "cli") {
			await getDatabricksUserIdentity();
			const cliHost = getCachedCliHost();
			if (cliHost) {
				cachedWorkspaceHostname = cliHost;
				return cachedWorkspaceHostname;
			} else throw new Error("CLI authentication succeeded but hostname was not cached");
		} else {
			cachedWorkspaceHostname = getHostUrl();
			return cachedWorkspaceHostname;
		}
	} catch (error) {
		throw new Error(`Unable to determine Databricks workspace hostname: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}
const LOG_SSE_EVENTS = process.env.LOG_SSE_EVENTS === "true";
const API_PROXY = process.env.API_PROXY;
const endpointDetailsCache = /* @__PURE__ */ new Map();
const ENDPOINT_DETAILS_CACHE_DURATION = 300 * 1e3;
/**
* Checks if context should be injected based on cached endpoint details.
* Returns true if API_PROXY is set or if the endpoint task type is agent/v2/chat or agent/v1/responses.
*/
function shouldInjectContext() {
	const servingEndpoint = process.env.DATABRICKS_SERVING_ENDPOINT;
	if (!servingEndpoint) return Boolean(API_PROXY);
	const endpointTask = endpointDetailsCache.get(servingEndpoint)?.task;
	return shouldInjectContextForEndpoint(endpointTask);
}
const databricksFetch = async (input, init) => {
	const url = input.toString();
	let requestInit = init;
	const headers = new Headers(requestInit?.headers);
	const conversationId = headers.get(CONTEXT_HEADER_CONVERSATION_ID);
	const userId = headers.get(CONTEXT_HEADER_USER_ID);
	headers.delete(CONTEXT_HEADER_CONVERSATION_ID);
	headers.delete(CONTEXT_HEADER_USER_ID);
	requestInit = {
		...requestInit,
		headers
	};
	if (conversationId && userId && requestInit?.body && typeof requestInit.body === "string") {
		if (shouldInjectContext()) try {
			const body = JSON.parse(requestInit.body);
			const enhancedBody = {
				...body,
				context: {
					...body.context,
					conversation_id: conversationId,
					user_id: userId
				}
			};
			requestInit = {
				...requestInit,
				body: JSON.stringify(enhancedBody)
			};
		} catch {}
	}
	if (requestInit?.body) try {
		const requestBody = typeof requestInit.body === "string" ? JSON.parse(requestInit.body) : requestInit.body;
		console.log("Databricks request:", JSON.stringify({
			url,
			method: requestInit.method || "POST",
			body: requestBody
		}));
	} catch (_e) {
		console.log("Databricks request (raw):", {
			url,
			method: requestInit.method || "POST",
			body: requestInit.body
		});
	}
	const response = await fetch(url, requestInit);
	if (LOG_SSE_EVENTS && response.body) {
		const contentType = response.headers.get("content-type") || "";
		if (contentType.includes("text/event-stream") || contentType.includes("application/x-ndjson")) {
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let eventCounter = 0;
			const loggingStream = new ReadableStream({
				async pull(controller) {
					const { done, value } = await reader.read();
					if (done) {
						console.log("[SSE] Stream ended");
						controller.close();
						return;
					}
					const lines = decoder.decode(value, { stream: true }).split("\n").filter((line) => line.trim());
					for (const line of lines) {
						eventCounter++;
						if (line.startsWith("data:")) {
							const data = line.slice(5).trim();
							try {
								const parsed = JSON.parse(data);
								console.log(`[SSE #${eventCounter}]`, JSON.stringify(parsed));
							} catch {
								console.log(`[SSE #${eventCounter}] (raw)`, data);
							}
						} else if (line.trim()) console.log(`[SSE #${eventCounter}] (line)`, line);
					}
					controller.enqueue(value);
				},
				cancel() {
					reader.cancel();
				}
			});
			return new Response(loggingStream, {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers
			});
		}
	}
	return response;
};
let oauthProviderCache = null;
let oauthProviderCacheTime = 0;
const PROVIDER_CACHE_DURATION = 300 * 1e3;
async function getOrCreateDatabricksProvider() {
	if (oauthProviderCache && Date.now() - oauthProviderCacheTime < PROVIDER_CACHE_DURATION) {
		console.log("Using cached OAuth provider");
		return oauthProviderCache;
	}
	console.log("Creating new OAuth provider");
	await getProviderToken();
	const provider = createDatabricksProvider({
		useRemoteToolCalling: true,
		baseURL: `${await getWorkspaceHostname()}/serving-endpoints`,
		formatUrl: ({ baseUrl, path }) => API_PROXY ?? `${baseUrl}${path}`,
		fetch: async (...[input, init]) => {
			const currentToken = await getProviderToken();
			const headers = new Headers(init?.headers);
			headers.set("Authorization", `Bearer ${currentToken}`);
			return databricksFetch(input, {
				...init,
				headers
			});
		}
	});
	oauthProviderCache = provider;
	oauthProviderCacheTime = Date.now();
	return provider;
}
const getEndpointDetails = async (servingEndpoint) => {
	const cached$1 = endpointDetailsCache.get(servingEndpoint);
	if (cached$1 && Date.now() - cached$1.timestamp < ENDPOINT_DETAILS_CACHE_DURATION) return cached$1;
	const currentToken = await getProviderToken();
	const hostname = await getWorkspaceHostname();
	const headers = new Headers();
	headers.set("Authorization", `Bearer ${currentToken}`);
	const returnValue = {
		task: (await (await databricksFetch(`${hostname}/api/2.0/serving-endpoints/${servingEndpoint}`, {
			method: "GET",
			headers
		})).json()).task,
		timestamp: Date.now()
	};
	endpointDetailsCache.set(servingEndpoint, returnValue);
	return returnValue;
};
var OAuthAwareProvider = class {
	modelCache = /* @__PURE__ */ new Map();
	CACHE_DURATION = 300 * 1e3;
	async languageModel(id) {
		const cached$1 = this.modelCache.get(id);
		if (cached$1 && Date.now() - cached$1.timestamp < this.CACHE_DURATION) {
			console.log(`Using cached model for ${id}`);
			return cached$1.model;
		}
		const provider = await getOrCreateDatabricksProvider();
		const wrappedModel = wrapLanguageModel({
			model: await (async () => {
				if (API_PROXY) return provider.responses(id);
				if (id === "title-model" || id === "artifact-model") return provider.chatCompletions("databricks-meta-llama-3-3-70b-instruct");
				if (!process.env.DATABRICKS_SERVING_ENDPOINT) throw new Error("Please set the DATABRICKS_SERVING_ENDPOINT environment variable to the name of an agent serving endpoint");
				const servingEndpoint = process.env.DATABRICKS_SERVING_ENDPOINT;
				const endpointDetails = await getEndpointDetails(servingEndpoint);
				console.log(`Creating fresh model for ${id}`);
				switch (endpointDetails.task) {
					case "agent/v2/chat": return provider.chatAgent(servingEndpoint);
					case "agent/v1/responses":
					case "agent/v2/responses": return provider.responses(servingEndpoint);
					case "llm/v1/chat": return provider.chatCompletions(servingEndpoint);
					default: return provider.responses(servingEndpoint);
				}
			})(),
			middleware: [extractReasoningMiddleware({ tagName: "think" })]
		});
		this.modelCache.set(id, {
			model: wrappedModel,
			timestamp: Date.now()
		});
		return wrappedModel;
	}
};
const providerInstance = new OAuthAwareProvider();
function getDatabricksServerProvider() {
	return providerInstance;
}

//#endregion
export { union as _, getDatabricksServerProvider as a, createUIMessageStream as c, streamText as d, _enum as f, string as g, object$1 as h, databricksFetch as i, generateText as l, array$1 as m, CONTEXT_HEADER_USER_ID as n, shouldInjectContextForEndpoint as o, any as p, OAuthAwareProvider as r, convertToModelMessages as s, CONTEXT_HEADER_CONVERSATION_ID as t, pipeUIMessageStreamToResponse as u };