declare module "intl-tel-input/reactWithUtils" {
    import { ComponentType, Ref } from "react";

    interface IntlTelInputProps {
        onChangeNumber?: (number: string) => void;
        onChangeCountry?: (country: string) => void;
        onChangeValidity?: (isValid: boolean) => void;
        onChangeErrorCode?: (errorCode: number | null) => void;
        initialValue?: string;
        disabled?: boolean;
        usePreciseValidation?: boolean;
        initOptions?: Record<string, unknown>;
        inputProps?: Record<string, unknown>;
        ref?: Ref<unknown>;
    }

    const IntlTelInput: ComponentType<IntlTelInputProps>;
    export default IntlTelInput;
}

declare module "intl-tel-input/styles" {}
