# Landing Page Generator Specification

## Introduction

This project aims to create a landing page generator that iteratively improves a design implementation using feedback from an LLM (Language Model). The process involves comparing the generated design with the original and refining it over multiple steps.

## Workflow Overview

- The user provides an original design image.
- The LLM attempts to implement the design using the provided image.
  - Refer to the first user message in `conversation.ts` for guidance on interpretation.
- The application generates an image from the LLM's implemented code using the `screenshot.ts` service.
- The user sends a new message containing both the original design image and the generated image, requesting the LLM to improve its implementation.
- The LLM refines its implementation based on the new input.
- Steps 3 to 5 are repeated for *N* iterations, with the user providing feedback each time.
- At the end of the iterations, the application returns the LLM's final code implementation.

## Implementation Details

- **Conversation Management**: Write code to handle the conversation flow, updating messages appropriately at each step.
- **HTML Extraction**: After each LLM response, extract the HTML code to use in subsequent iterations.
- **Variable Assignments**: Store user messages and LLM responses in variables for easier manipulation and editing.
- **Image Handling**: Use the `screenshot.ts` service to generate images from the LLM's code and the `upload.ts` service for image uploads.
- **Parameterization**: The application should accept an image URL and a number of steps as input parameters.

## Debugging and Logging

- Implement comprehensive logging for each conversation and response to aid in debugging.
- Ensure logs are easy to read and provide sufficient detail to trace the flow of the application.

## Requirements

- The application must be written in **TypeScript**.
- Utilize existing services like `screenshot.ts` and `upload.ts` for respective functionalities.

## Conclusion

Following this specification will result in an application that can iteratively refine a landing page design using LLM capabilities and user feedback, ultimately producing an optimized implementation of the original design.

## Future Enhancements

- Consider implementing error handling for missing or invalid inputs.
- Explore the possibility of automating the entire iterative process without manual intervention.
