"use client";

import { useCallback, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";

import { FormField, FormFieldProps } from "./FormField";
import { CloseOutlined } from "@mui/icons-material";

export interface FileUploaderProps
  extends Omit<FormFieldProps, "input" | "variant" | "onChange"> {
  /**
   * The id for the `FileUploader`.
   *
   * If one is not provided, a uuid is generated and assigned.
   * @default uuid()
   */
  id?: string;
  /**
   * The accept attribute for the `FileUploader`.
   * 
   * A unique file type specifier is a string that describes a type of file that may be selected by the user in an <input> element of type file. Each unique file type specifier may take one of the following forms:
   * * A valid case-insensitive filename extension, starting with a period (".") character. For example: .jpg, .pdf, or .doc.
   * * A valid MIME type string, with no extensions.
   * * The string audio/* meaning "any audio file".
   * * The string video/* meaning "any video file".
   * * The string image/* meaning "any image file".

   * The accept attribute takes a string containing one or more of these unique file type specifiers as its value, separated by commas.
   * @default "*.*"
   */
  accept?: string;
  /**
   * The maximum number of files that can be uploaded.
   * @default 1
   */
  limit?: number;
  /**
   * The maximum file size in bytes that the FileUploader should allow.
   */
  maxFileSize?: number;

  variant?: "text" | "dataUri" | "upload";

  /**
   * Callback fired when the value of the `FileUploader` is changed.
   * The callback will be passed the new value, which is dependent
   * on the `outputType` prop.
   */
  onChange?: (
    value:
      | File[]
      | string
      | { filename: string; type: string; content: string }
      | undefined
  ) => void;

  /**
   * The type of output to return from the FileUploader in it's onChange callback.
   * @default content
   */
  outputType?: "content" | "object" | "files";
}

export default function FileUploader(props: FileUploaderProps) {
  const {
    id = uuid() as string,
    accept,
    label,
    limit = 1,
    maxFileSize = 5000000,
    variant = "text",
    onChange,
    outputType = "content",
    ...formFieldProps
  } = props || {};

  const [value, setValue] = useState<File[]>([]);
  const [files, setFiles] = useState<File[]>([...value]);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleFileInputChange = useCallback(
    (e: React.SyntheticEvent<EventTarget>) => {
      e.stopPropagation();
      e.preventDefault();

      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      const newFiles = Object.values(target.files).map((file: File) => file);
      if (newFiles) {
        const updatedFiles = [...files, ...newFiles];
        const updatedErrors = { ...fileErrors };
        let validFiles = [...value, ...newFiles];
        updatedFiles.forEach((file) => {
          if (validFiles.indexOf(file) > limit - 1) {
            updatedErrors[
              file.name
            ] = `File not uploaded.  Maximum number of files exceeded. Must not be more than ${limit}.`;
            validFiles = validFiles.filter((f) => f.name !== file.name);
          } else if (file.size > maxFileSize) {
            updatedErrors[
              file.name
            ] = `File not uploaded.  Maximum file size exceeded. Must not be more than ${getFileSize(
              maxFileSize
            )}.`;
            validFiles = validFiles.filter((f) => f.name !== file.name);
          } else if (validFiles.indexOf(file) > -1) {
            updatedErrors[file.name] = "";
          }
        });
        setFileErrors(updatedErrors);
        setFiles(updatedFiles);
        setValue(validFiles);

        if (
          validFiles &&
          validFiles.length > 0 &&
          ["text", "dataUri"].includes(variant) &&
          limit === 1
        ) {
          const reader = new FileReader();
          const file = validFiles[0];
          reader.onload = async (e) =>
            onChange?.(
              outputType === "content"
                ? e.target?.result?.toString()
                : outputType === "files"
                ? validFiles
                : {
                    filename: file.name,
                    type: file.type,
                    content: e.target?.result?.toString() || "",
                  }
            );

          if (variant === "text") {
            reader.readAsText(file);
          } else if (variant === "dataUri") {
            reader.readAsDataURL(file);
          }
        }
        // field.onChange(validFiles);
      }
    },
    [
      files,
      limit,
      maxFileSize,
      fileErrors,
      onChange,
      outputType,
      value,
      variant,
    ]
  );

  const fileRemove = (file: File) => {
    const newValue = [...value];
    newValue.splice(newValue.indexOf(file), 1);
    setFiles([...newValue]);
    setValue(newValue);
    setFileErrors({});

    if ((variant === "text" || variant === "dataUri") && limit === 1) {
      onChange?.(
        outputType === "content"
          ? ""
          : {
              filename: "",
              type: "",
              content: "",
            }
      );
    }
  };

  // 👇 Calculates size in kilobytes or megabytes
  const getFileSize = (size: number) => {
    return size < 1000000
      ? `${Math.floor(size / 1000)} KB`
      : `${(size / 1000000).toFixed(1)} MB`;
  };

  // 👇 Returns the text for the accept attribute
  const getAcceptsText = (accept: string) => {
    if (!accept) return "";

    const accepts = accept.split(",");
    const acceptsText = accepts.map((accept) => {
      if (accept === "*.*") return "Any file";
      if (accept === "audio/*") return "Any audio file";
      if (accept === "video/*") return "Any video file";
      if (accept === "image/*") return "Any image file";

      if (accept.startsWith(".")) {
        const extension = accept.replace(".", "");
        return extension.toUpperCase();
      } else if (accept.includes("/")) {
        const extension = accept.split("/")[1];
        return extension.toUpperCase();
      } else {
        return accept.toUpperCase();
      }
    });

    if (acceptsText.length > 1) {
      acceptsText[acceptsText.length - 1] = `or ${
        acceptsText[acceptsText.length - 1]
      }`;
    }

    return acceptsText.join(", ");
  };

  return (
    <FormField
      id={id}
      fullWidth
      {...formFieldProps}
      variant="outlined"
      input={
        <Box
          id={id}
          sx={{
            // backgroundColor: theme.designTokens?.Global?.Neutral["0"].value,
            border: "1px solid",
            // borderColor:
            //   theme.designTokens?.Global?.Shape.OnSurface.Outlines.value,
            borderRadius: "4px",
            display: "flex",
            p: 2,
            width: "100%",
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={9}>
              {label && <Typography variant="body1">{label}</Typography>}
              {accept ? (
                <Typography variant="body1">{`${getAcceptsText(accept)}${
                  maxFileSize ? ` (max. ${getFileSize(maxFileSize)})` : ""
                }`}</Typography>
              ) : (
                <Typography variant="body1">{`${getAcceptsText("*.*")}${
                  maxFileSize ? ` (max. ${getFileSize(maxFileSize)})` : ""
                }`}</Typography>
              )}
            </Grid>
            <Grid
              item
              xs={3}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Button
                color="primary"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  setFileErrors({});
                  setFiles([...value]);

                  wrapperRef?.current?.click?.();
                }}
                sx={{ p: 1, zIndex: 1 }}
              >
                <Box sx={{ p: 1 }}>Browse</Box>
              </Button>
              <Box
                ref={wrapperRef}
                htmlFor={`${id}__input`}
                component={"label"}
              >
                <input
                  type="file"
                  id={`${id}__input`}
                  onChange={handleFileInputChange}
                  multiple={limit > 1}
                  accept={accept}
                  style={{
                    display: "none",
                  }}
                />
              </Box>
            </Grid>
            {files.length > 0 ? (
              <Stack sx={{ ml: 2, mt: 2, width: "100%" }}>
                {files.map((file, index) => {
                  return (
                    <Box
                      key={index}
                      sx={{
                        border: "1px solid",
                        // borderColor:
                        //   theme.designTokens?.Global?.Shape.OnSurface.Outlines
                        //     .value,
                        p: 2,
                        position: "relative",
                      }}
                    >
                      <Box display="flex">
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body1">{file.name}</Typography>
                          <Typography variant="body2">
                            {getFileSize(file.size)}
                          </Typography>
                          {fileErrors?.[file.name] && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: "red",
                              }}
                            >
                              {fileErrors?.[file.name]}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          fileRemove(file);
                        }}
                        startIcon={<CloseOutlined />}
                        color="info"
                        sx={{
                          border: "none",
                          position: "absolute",
                          right: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            ) : null}
          </Grid>
        </Box>
      }
    />
  );
}
