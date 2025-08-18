import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import fs from "fs/promises";
import path from "path";

// Initialize the embedding model
const embeddingModel = new GoogleGenerativeAIEmbeddings({
  apiKey:
    process.env.GEMINI_API_KEY || "AIzaSyBlob6YbAnKxRpBDJSFoOnMGdDcH2JdWg4",
  model: "embedding-001",
});

async function ingestAndSaveDataset(datasetDir, savePath) {
  try {
    console.log("\n=== Starting Dataset Ingestion ===");

    const files = await fs.readdir(datasetDir);
    const documents = [];

    for (const file of files) {
      // Read and process each JSON dataset file
      if (file.endsWith(".json")) {
        const filePath = path.join(datasetDir, file);
        try {
          const raw = await fs.readFile(filePath, "utf-8");
          const data = JSON.parse(raw);
          const records = Array.isArray(data) ? data : [data];

          // Embed each record into a Document
          for (const item of records) {
            const text =
              item.description ||
              item.text ||
              item.name ||
              JSON.stringify(item);

            if (!text?.trim()) {
              console.log(`Skipping a document with no text`);
              continue;
            }

            const metadata = {};
            for (const key in item) {
              const value = item[key];
              if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean" ||
                (Array.isArray(value) &&
                  value.every(
                    (v) => typeof v === "string" || typeof v === "number"
                  ))
              ) {
                metadata[key] = value;
              }
            }

            documents.push(
              new Document({
                pageContent: text,
                metadata: {
                  ...metadata,
                  source: "dataset",
                  filename: file,
                },
              })
            );
          }
        } catch (err) {
          console.error(`Error processing ${file}:`, err.message);
        }
      }
    }

    if (documents.length === 0) {
      console.log("No documents to ingest.");
      return;
    }

    console.log(
      `Ingesting ${documents.length} documents into MemoryVectorStore...`
    );

    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddingModel
    );

    console.log(`✓ Successfully ingested ${documents.length} documents.`);

    // Convert the vector store's internal memoryVectors array to a serializable format
    const serializedData = JSON.stringify(
      vectorStore.memoryVectors.map((mv) => ({
        pageContent: mv.pageContent,
        metadata: mv.metadata,
        embedding: mv.embedding,
      })),
      null,
      2
    );

    await fs.writeFile(savePath, serializedData);

    console.log(`✓ Successfully saved vector store to ${savePath}.`);
    return vectorStore;
  } catch (error) {
    console.error("\n❌ Execution error:", error.message);
    if (error.message.includes("API key")) {
      console.log(
        "\n💡 Solution: Ensure your GEMINI_API_KEY environment variable is set and valid."
      );
    }
    return null;
  }
}

async function loadAndQueryDataset(loadPath, queryText) {
  try {
    console.log("\n=== Starting Vector Store Loading and Querying ===");

    console.log(`\n1. Loading vector store from ${loadPath}...`);
    const serializedData = await fs.readFile(loadPath, "utf-8");
    const parsedData = JSON.parse(serializedData);

    // Reconstruct documents and embeddings from the parsed data
    const documents = parsedData.map(
      (item) =>
        new Document({
          pageContent: item.pageContent,
          metadata: item.metadata,
        })
    );
    const embeddings = parsedData.map((item) => item.embedding);

    // Correctly reconstruct the vector store
    const vectorStore = new MemoryVectorStore(embeddingModel);
    await vectorStore.addVectors(embeddings, documents);

    console.log(`✓ Successfully loaded vector store.`);

    console.log(`\n2. Querying the vector database for: "${queryText}"`);

    const results = await vectorStore.similaritySearch(queryText, 5);

    console.log("\n=== Query Results ===");
    if (results.length === 0) {
      console.log(
        "No results found. This might indicate that the store was loaded empty."
      );
    } else {
      results.forEach((result, index) => {
        console.log(`\n--- Result ${index + 1} ---`);
        console.log("Text:", result);
      });
    }
  } catch (error) {
    console.error("\n❌ Execution error:", error.message);
  }
}

// Main execution flow
async function main() {
  const datasetDir = path.resolve("datasets/mauritius_attractions_dataset");
  const saveFilePath = path.resolve("vector_store.json");
  const query = "beaches in the north";

  // Check if the saved file exists
  try {
    await fs.access(saveFilePath);
    // If it exists, load and query
    await loadAndQueryDataset(saveFilePath, query);
  } catch (error) {
    // If it doesn't exist, ingest and save
    await ingestAndSaveDataset(datasetDir, saveFilePath);
    await loadAndQueryDataset(saveFilePath, query);
  }
}

main().catch(console.error);
