import { inject, provide } from "vue";
//#region src/controls/binding-provider/context.ts
const BINDING_PROVIDER_KEY = Symbol("open-pencil-binding-provider");
function provideBindingProvider(provider) {
	provide(BINDING_PROVIDER_KEY, provider);
}
function useBindingProvider() {
	return inject(BINDING_PROVIDER_KEY, void 0);
}
//#endregion
export { provideBindingProvider, useBindingProvider };

//# sourceMappingURL=context.js.map