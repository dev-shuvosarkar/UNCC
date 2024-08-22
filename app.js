const fs = require("fs/promises");

(async () => {
  // Commands
  const CREATE_FILE_COMMAND = "create a file";
  const DELETE_FILE_COMMAND = "delete the file";
  const RENAME_FILE_COMMAND = "rename the file";
  const ADD_TO_FILE_COMMAND = "add to the file";

  // Create a file
  const createFile = async (path) => {
    try {
      const existingFileHandle = await fs.open(path, "r");
      await existingFileHandle.close();
      console.log(`The file ${path} already exists`);
    } catch (err) {
      const newFileHandle = await fs.open(path, "w");
      console.log(`A new file ${path} was created successfully`);
      await newFileHandle.close();
    }
  };

  // Delete a file
  const deleteFile = async (path) => {
    if (path) {
      try {
        await fs.unlink(path);
        console.log("File deleted successfully");
      } catch (err) {
        console.error("Error deleting the file:", err);
      }
    }
  };

  // Rename a file
  const renameFile = async (path, newPath) => {
    try {
      await fs.rename(path, newPath);
      console.log("File renamed successfully");
    } catch (err) {
      console.error("Error renaming the file:", err);
    }
  };

  // Add content to the file
  const addToFile = async (filePath, content) => {
    try {
      await fs.appendFile(filePath, content, "utf8");
      console.log(`Content added to ${filePath} successfully`);
    } catch (err) {
      console.error("Error adding content to the file:", err);
    }
  };

  // Watcher
  const watcher = fs.watch("./textFile/command.txt");

  let lastEventTime = 0;
  const debounceDelay = 69; // 69 ms delay to filter out duplicate events

  for await (const event of watcher) {
    const now = Date.now();

    if (now - lastEventTime > debounceDelay) {
      if (event.eventType === "change") {
        try {
          const commandFileHandler = await fs.open(
            "./textFile/command.txt",
            "r"
          );
          const size = (await commandFileHandler.stat()).size;
          const buff = Buffer.alloc(size);
          const offset = 0;
          const length = buff.byteLength;
          const position = 0;

          await commandFileHandler.read(buff, offset, length, position);
          const commandFileContent = buff.toString("utf-8");

          // Process the commands, ignoring lines starting with '#'
          const commands = commandFileContent
            .split("\n")
            .map((line) => line.trim());

          for (const line of commands) {
            if (line.startsWith("#") || line === "") {
              continue; // Skip comments and empty lines
            }

            if (line.startsWith(CREATE_FILE_COMMAND)) {
              const filePath = line
                .substring(CREATE_FILE_COMMAND.length)
                .trim();
              await createFile(`./textFile/${filePath}`);
            } else if (line.startsWith(DELETE_FILE_COMMAND)) {
              const filePath = line
                .substring(DELETE_FILE_COMMAND.length)
                .trim();
              await deleteFile(`./textFile/${filePath}`);
            } else if (line.startsWith(RENAME_FILE_COMMAND)) {
              const paths = line
                .substring(RENAME_FILE_COMMAND.length)
                .trim()
                .split(" ");
              const filePath = paths[0];
              const renamePath = paths[1];
              await renameFile(
                `./textFile/${filePath}`,
                `./textFile/${renamePath}`
              );
            } else if (line.startsWith(ADD_TO_FILE_COMMAND)) {
              const splitCommand = line
                .substring(ADD_TO_FILE_COMMAND.length)
                .trim()
                .split(" ");
              const filePath = splitCommand.shift(); // First part is the file path
              const content = splitCommand.join(" "); // The rest is the content
              await addToFile(`./textFile/${filePath}`, content);
            }
          }

          await commandFileHandler.close();
        } catch (err) {
          console.error("Error processing the commands:", err);
        }
        lastEventTime = now;
      }
    }
  }
})();
