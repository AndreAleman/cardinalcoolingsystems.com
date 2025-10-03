// import { productImportWorkflow } from "../workflows/product-import";

// // Medusa will inject the container when this file is executed by `npx medusa exec ...`
// export default async function (container) {
//   try {
//     console.log("Starting product import workflow...");
//     const workflowInput = {
//       csvFilePath: "products_13h_to_import.csv"
//     };
//     // Pass the container or scope explicitly to the workflow
//     const { result } = await productImportWorkflow(container).run({ input: workflowInput });
//     console.log("Workflow completed successfully!");
//     console.log("Result:", JSON.stringify(result, null, 2));
//   } catch (error) {
//     console.error("Workflow failed:", error);
//     process.exit(1);
//   }
// }
