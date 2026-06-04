import { t as __commonJSMin } from "./chunk-CNPInK3f.mjs";

//#region ../node_modules/@vercel/oidc/dist/token-error.js
var require_token_error = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __export = (target, all) => {
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: () => from[key],
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
	var token_error_exports = {};
	__export(token_error_exports, { VercelOidcTokenError: () => VercelOidcTokenError });
	module.exports = __toCommonJS(token_error_exports);
	var VercelOidcTokenError = class extends Error {
		constructor(message, cause) {
			super(message);
			this.name = "VercelOidcTokenError";
			this.cause = cause;
		}
		toString() {
			if (this.cause) return `${this.name}: ${this.message}: ${this.cause}`;
			return `${this.name}: ${this.message}`;
		}
	};
}));

//#endregion
export { require_token_error as t };