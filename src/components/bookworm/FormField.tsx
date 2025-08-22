import { cloneElement, ReactElement } from "react";
import {
  FormControl,
  FormControlProps,
  FormHelperText,
  InputLabel,
} from "@mui/material";
import { v4 as uuid } from "uuid";

export interface FormFieldProps extends FormControlProps {
  /**
   * The form field identifier.
   */
  id?: string;
  /**
   * The form field label text.
   */
  label?: string;
  /**
   * The helper text for the input.
   */
  helperText?: string;
  /**
   * The input field to be rendered.
   */
  input: ReactElement;
}

export function FormField(props: FormFieldProps) {
  const { id = uuid(), label, helperText, input, ...rest } = props || {};
  const inputId = id ? `${id}-input` : undefined;
  const helperId = helperText && id ? `${id}-helper-text` : undefined;

  return (
    <FormControl {...rest}>
      {label && <InputLabel htmlFor={inputId}>{label}</InputLabel>}
      {cloneElement(input, { id: inputId, "aria-describedby": helperId })}
      {helperText && (
        <FormHelperText id={helperId}>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
}
