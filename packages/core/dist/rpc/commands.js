import { analyzeClustersCommand, analyzeColorsCommand, analyzeOverlapsCommand, analyzeSpacingCommand, analyzeTypographyCommand } from "./analyze-commands.js";
import { findCommand, infoCommand, nodeCommand, pagesCommand, queryCommand, treeCommand } from "./read-commands.js";
import { variablesCommand } from "./variables-command.js";
//#region src/rpc/commands.ts
const ALL_RPC_COMMANDS = [
	infoCommand,
	pagesCommand,
	treeCommand,
	findCommand,
	queryCommand,
	nodeCommand,
	variablesCommand,
	analyzeColorsCommand,
	analyzeTypographyCommand,
	analyzeSpacingCommand,
	analyzeClustersCommand,
	analyzeOverlapsCommand
];
function executeRPCCommand(graph, name, args) {
	const cmd = ALL_RPC_COMMANDS.find((c) => c.name === name);
	if (!cmd) throw new Error(`Unknown command: ${name}`);
	return cmd.execute(graph, args);
}
//#endregion
export { ALL_RPC_COMMANDS, analyzeClustersCommand, analyzeColorsCommand, analyzeOverlapsCommand, analyzeSpacingCommand, analyzeTypographyCommand, executeRPCCommand, findCommand, infoCommand, nodeCommand, pagesCommand, queryCommand, treeCommand, variablesCommand };

//# sourceMappingURL=commands.js.map