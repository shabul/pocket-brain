import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
import readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = process.env.MODEL_PATH ?? path.join(__dirname, "gemma.gguf");

console.log("Loading model...");
const llama = await getLlama();
const model = await llama.loadModel({ modelPath });
const context = await model.createContext();
const session = new LlamaChatSession({
  contextSequence: context.getSequence(),
});
console.log("Model ready! Type your message (Ctrl+C to quit)\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = () => rl.question("You: ", async (input) => {
  if (!input.trim()) return ask();
  process.stdout.write("AI: ");
  await session.prompt(input, {
    onTextChunk: (chunk) => process.stdout.write(chunk),
  });
  console.log("\n");
  ask();
});
ask();
