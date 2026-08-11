//#region src/transport/paths.d.ts
/**
 * Returns the directory for the MCP socket file.
 *
 * When OPENPENCIL_MCP_SOCKET is set, its dirname is used as the socket
 * directory. When unset, the platform default from getPlatformDir() is used.
 * Creates the directory (with restrictive permissions) if it does not exist.
 *
 * NOTE: The discovery file always lives at getPlatformDir(), regardless of
 * OPENPENCIL_MCP_SOCKET. This function should NOT be used to locate it.
 */
declare function getSocketDir(): Promise<string>;
/**
 * Returns the full path to the MCP Unix domain socket.
 *
 * On macOS/Linux: <socketDir>/mcp.sock
 *
 * When OPENPENCIL_MCP_SOCKET is set, its value is returned directly
 * (no directory resolution needed).
 */
declare function getSocketPath(): Promise<string>;
/**
 * Returns the full path to the MCP discovery JSON file.
 *
 * The discovery file lives at the platform-default location so clients can
 * find it without knowing whether OPENPENCIL_MCP_SOCKET is set. It contains
 * the actual socket path (which may be overridden) in its `socketPath` field,
 * so clients read the discovery file to learn where to connect — not the other
 * way around.
 *
 * Set OPENPENCIL_MCP_DISCOVERY_PATH to relocate the discovery file (e.g. to a
 * temp directory for test isolation). The desktop app reads the platform
 * default via its own path computation (src/app/automation/mcp/spawn.ts) and
 * does not honor this override, so it is primarily useful for tests and
 * standalone server invocations. The parent directory is created (0o700) so
 * writeDiscoveryFile's atomic temp-then-rename succeeds.
 */
declare function getDiscoveryPath(): Promise<string>;
/**
 * Returns true if the current platform supports Unix domain sockets.
 * Unix domain sockets are available on macOS, Linux, and other POSIX
 * platforms but not on native Windows. WSL is detected as Linux.
 */
declare function platformHasUnixSockets(): boolean;
/**
 * Returns the platform name for display purposes.
 */
declare function platformName(): 'macos' | 'linux' | 'windows' | 'other';
//#endregion
export { getDiscoveryPath, getSocketDir, getSocketPath, platformHasUnixSockets, platformName };
//# sourceMappingURL=transport.d.mts.map