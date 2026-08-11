import { decompress } from "fzstd";
//#region src/schema-runtime/bb.ts
let int32 = /* @__PURE__ */ new Int32Array(1);
let float32 = new Float32Array(int32.buffer);
const textDecoder = new TextDecoder();
var ByteBuffer = class {
	_data;
	_index;
	length;
	constructor(data) {
		if (data && !(data instanceof Uint8Array)) throw new Error("Must initialize a ByteBuffer with a Uint8Array");
		this._data = data || /* @__PURE__ */ new Uint8Array(256);
		this._index = 0;
		this.length = data ? data.length : 0;
	}
	/**
	* Returns a view into the internal buffer, not a copy.
	*
	* Consumers transferring this Uint8Array across thread boundaries (e.g. via
	* postMessage with transferables) MUST copy first: `new Uint8Array(buffer)`.
	* Otherwise, if multiple Uint8Arrays share the same underlying ArrayBuffer and
	* one is transferred, all views into that buffer become detached.
	*/
	toUint8Array() {
		return this._data.subarray(0, this.length);
	}
	readByte() {
		return this._data[this._index++];
	}
	readByteArray() {
		const length = this.readVarUint();
		const start = this._index;
		this._index = start + length;
		return this._data.slice(start, start + length);
	}
	readVarFloat() {
		const index = this._index;
		const data = this._data;
		const first = data[index];
		if (first === 0) {
			this._index = index + 1;
			return 0;
		}
		let bits = first | data[index + 1] << 8 | data[index + 2] << 16 | data[index + 3] << 24;
		this._index = index + 4;
		bits = bits << 23 | bits >>> 9;
		int32[0] = bits;
		return float32[0];
	}
	readVarUint() {
		const data = this._data;
		let i = this._index;
		let b = data[i++];
		let value = b & 127;
		if (b < 128) {
			this._index = i;
			return value;
		}
		b = data[i++];
		value |= (b & 127) << 7;
		if (b < 128) {
			this._index = i;
			return value;
		}
		b = data[i++];
		value |= (b & 127) << 14;
		if (b < 128) {
			this._index = i;
			return value;
		}
		b = data[i++];
		value |= (b & 127) << 21;
		if (b < 128) {
			this._index = i;
			return value;
		}
		b = data[i++];
		value |= (b & 127) << 28;
		this._index = i;
		return value >>> 0;
	}
	readVarInt() {
		let value = this.readVarUint() | 0;
		return value & 1 ? ~(value >>> 1) : value >>> 1;
	}
	readVarUint64() {
		let value = BigInt(0);
		let shift = BigInt(0);
		let seven = BigInt(7);
		let byte;
		while ((byte = this.readByte()) & 128 && shift < 56) {
			value |= BigInt(byte & 127) << shift;
			shift += seven;
		}
		value |= BigInt(byte) << shift;
		return value;
	}
	readVarInt64() {
		let value = this.readVarUint64();
		let one = BigInt(1);
		let sign = value & one;
		value >>= one;
		return sign ? ~value : value;
	}
	readString() {
		const data = this._data;
		const start = this._index;
		let i = start;
		while (data[i] !== 0) i++;
		this._index = i + 1;
		return textDecoder.decode(data.subarray(start, i));
	}
	_growBy(amount) {
		if (this.length + amount > this._data.length) {
			let data = new Uint8Array(this.length + amount << 1);
			data.set(this._data);
			this._data = data;
		}
		this.length += amount;
	}
	writeByte(value) {
		let index = this.length;
		this._growBy(1);
		this._data[index] = value;
	}
	writeByteArray(value) {
		this.writeVarUint(value.length);
		let index = this.length;
		this._growBy(value.length);
		this._data.set(value, index);
	}
	writeVarFloat(value) {
		let index = this.length;
		float32[0] = value;
		let bits = int32[0];
		bits = bits >>> 23 | bits << 9;
		if ((bits & 255) === 0) {
			this.writeByte(0);
			return;
		}
		this._growBy(4);
		let data = this._data;
		data[index] = bits;
		data[index + 1] = bits >> 8;
		data[index + 2] = bits >> 16;
		data[index + 3] = bits >> 24;
	}
	writeVarUint(value) {
		if (value < 0 || value > 4294967295) throw new Error("Outside uint range: " + value);
		do {
			let byte = value & 127;
			value >>>= 7;
			this.writeByte(value ? byte | 128 : byte);
		} while (value);
	}
	writeVarInt(value) {
		if (value < -2147483648 || value > 2147483647) throw new Error("Outside int range: " + value);
		this.writeVarUint((value << 1 ^ value >> 31) >>> 0);
	}
	writeVarUint64(value) {
		if (typeof value === "string") value = BigInt(value);
		else if (typeof value !== "bigint") throw new Error(`Expected bigint but got ${typeof value}: ${String(value)}`);
		if (value < 0 || value > BigInt("0xFFFFFFFFFFFFFFFF")) throw new Error("Outside uint64 range: " + value);
		let mask = BigInt(127);
		let seven = BigInt(7);
		for (let i = 0; value > mask && i < 8; i++) {
			this.writeByte(Number(value & mask) | 128);
			value >>= seven;
		}
		this.writeByte(Number(value));
	}
	writeVarInt64(value) {
		if (typeof value === "string") value = BigInt(value);
		else if (typeof value !== "bigint") throw new Error(`Expected bigint but got ${typeof value}: ${String(value)}`);
		if (value < -BigInt("0x8000000000000000") || value > BigInt("0x7FFFFFFFFFFFFFFF")) throw new Error("Outside int64 range: " + value);
		let one = BigInt(1);
		this.writeVarUint64(value < 0 ? ~(value << one) : value << one);
	}
	writeString(value) {
		let codePoint;
		for (let i = 0; i < value.length; i++) {
			let a = value.charCodeAt(i);
			if (i + 1 === value.length || a < 55296 || a >= 56320) codePoint = a;
			else {
				let b = value.charCodeAt(++i);
				codePoint = (a << 10) + b + -56613888;
			}
			if (codePoint === 0) throw new Error("Cannot encode a string containing the null character");
			if (codePoint < 128) this.writeByte(codePoint);
			else {
				if (codePoint < 2048) this.writeByte(codePoint >> 6 & 31 | 192);
				else {
					if (codePoint < 65536) this.writeByte(codePoint >> 12 & 15 | 224);
					else {
						this.writeByte(codePoint >> 18 & 7 | 240);
						this.writeByte(codePoint >> 12 & 63 | 128);
					}
					this.writeByte(codePoint >> 6 & 63 | 128);
				}
				this.writeByte(codePoint & 63 | 128);
			}
		}
		this.writeByte(0);
	}
};
//#endregion
//#region src/schema-runtime/util.ts
function quote(text) {
	return JSON.stringify(text);
}
function error(text, line, column) {
	var error = new Error(text);
	error.line = line;
	error.column = column;
	throw error;
}
//#endregion
//#region src/schema-runtime/js.ts
function compileDecode(definition, definitions) {
	let lines = [];
	let indent = "  ";
	lines.push("function (bb) {");
	lines.push("  var result = {};");
	lines.push("  if (!(bb instanceof this.ByteBuffer)) {");
	lines.push("    bb = new this.ByteBuffer(bb);");
	lines.push("  }");
	lines.push("");
	if (definition.kind === "MESSAGE") {
		lines.push("  while (true) {");
		lines.push("    switch (bb.readVarUint()) {");
		lines.push("      case 0:");
		lines.push("        return result;");
		lines.push("");
		indent = "        ";
	}
	for (let i = 0; i < definition.fields.length; i++) {
		let field = definition.fields[i];
		let code;
		switch (field.type) {
			case "bool":
				code = "!!bb.readByte()";
				break;
			case "byte":
				code = "bb.readByte()";
				break;
			case "int":
				code = "bb.readVarInt()";
				break;
			case "uint":
				code = "bb.readVarUint()";
				break;
			case "float":
				code = "bb.readVarFloat()";
				break;
			case "string":
				code = "bb.readString()";
				break;
			case "int64":
				code = "bb.readVarInt64()";
				break;
			case "uint64":
				code = "bb.readVarUint64()";
				break;
			default: {
				let type = definitions[field.type];
				if (!type) error("Invalid type " + quote(field.type) + " for field " + quote(field.name), field.line, field.column);
				else if (type.kind === "ENUM") code = "this[" + quote(type.name) + "][bb.readVarUint()]";
				else code = "this[" + quote("decode" + type.name) + "](bb)";
			}
		}
		if (definition.kind === "MESSAGE") lines.push("      case " + field.value + ":");
		if (field.isArray) if (field.isDeprecated) if (field.type === "byte") lines.push(indent + "bb.readByteArray();");
		else {
			lines.push(indent + "var length = bb.readVarUint();");
			lines.push(indent + "while (length-- > 0) " + code + ";");
		}
		else if (field.type === "byte") lines.push(indent + "result[" + quote(field.name) + "] = bb.readByteArray();");
		else {
			lines.push(indent + "var length = bb.readVarUint();");
			lines.push(indent + "var values = result[" + quote(field.name) + "] = Array(length);");
			lines.push(indent + "for (var i = 0; i < length; i++) values[i] = " + code + ";");
		}
		else if (field.isDeprecated) lines.push(indent + code + ";");
		else lines.push(indent + "result[" + quote(field.name) + "] = " + code + ";");
		if (definition.kind === "MESSAGE") {
			lines.push("        break;");
			lines.push("");
		}
	}
	if (definition.kind === "MESSAGE") {
		lines.push("      default:");
		lines.push("        throw new Error(\"Attempted to parse invalid message\");");
		lines.push("    }");
		lines.push("  }");
	} else lines.push("  return result;");
	lines.push("}");
	return lines.join("\n");
}
function compileEncode(definition, definitions) {
	let lines = [];
	lines.push("function (message, bb) {");
	lines.push("  var isTopLevel = !bb;");
	lines.push("  if (isTopLevel) bb = new this.ByteBuffer();");
	for (let j = 0; j < definition.fields.length; j++) {
		let field = definition.fields[j];
		let code;
		if (field.isDeprecated) continue;
		switch (field.type) {
			case "bool":
				code = "bb.writeByte(value);";
				break;
			case "byte":
				code = "bb.writeByte(value);";
				break;
			case "int":
				code = "bb.writeVarInt(value);";
				break;
			case "uint":
				code = "bb.writeVarUint(value);";
				break;
			case "float":
				code = "bb.writeVarFloat(value);";
				break;
			case "string":
				code = "bb.writeString(value);";
				break;
			case "int64":
				code = "bb.writeVarInt64(value);";
				break;
			case "uint64":
				code = "bb.writeVarUint64(value);";
				break;
			default: {
				let type = definitions[field.type];
				if (!type) throw new Error("Invalid type " + quote(field.type) + " for field " + quote(field.name));
				else if (type.kind === "ENUM") code = "var encoded = this[" + quote(type.name) + "][value]; if (encoded === void 0) throw new Error(\"Invalid value \" + JSON.stringify(value) + " + quote(" for enum " + quote(type.name)) + "); bb.writeVarUint(encoded);";
				else code = "this[" + quote("encode" + type.name) + "](value, bb);";
			}
		}
		lines.push("");
		lines.push("  var value = message[" + quote(field.name) + "];");
		lines.push("  if (value != null) {");
		if (definition.kind === "MESSAGE") lines.push("    bb.writeVarUint(" + field.value + ");");
		if (field.isArray) if (field.type === "byte") lines.push("    bb.writeByteArray(value);");
		else {
			lines.push("    var values = value, n = values.length;");
			lines.push("    bb.writeVarUint(n);");
			lines.push("    for (var i = 0; i < n; i++) {");
			lines.push("      value = values[i];");
			lines.push("      " + code);
			lines.push("    }");
		}
		else lines.push("    " + code);
		if (definition.kind === "STRUCT") {
			lines.push("  } else {");
			lines.push("    throw new Error(" + quote("Missing required field " + quote(field.name)) + ");");
		}
		lines.push("  }");
	}
	if (definition.kind === "MESSAGE") lines.push("  bb.writeVarUint(0);");
	lines.push("");
	lines.push("  if (isTopLevel) return bb.toUint8Array();");
	lines.push("}");
	return lines.join("\n");
}
function compileSchemaJS(schema) {
	let definitions = {};
	let name = schema.package;
	let js = [];
	if (name !== null) js.push("var " + name + " = exports || " + name + " || {}, exports;");
	else {
		js.push("var exports = exports || {};");
		name = "exports";
	}
	js.push(name + ".ByteBuffer = " + name + ".ByteBuffer || require(\"kiwi-schema\").ByteBuffer;");
	for (let i = 0; i < schema.definitions.length; i++) {
		let definition = schema.definitions[i];
		definitions[definition.name] = definition;
	}
	for (let i = 0; i < schema.definitions.length; i++) {
		let definition = schema.definitions[i];
		switch (definition.kind) {
			case "ENUM": {
				let value = {};
				for (let j = 0; j < definition.fields.length; j++) {
					let field = definition.fields[j];
					value[field.name] = field.value;
					value[field.value] = field.name;
				}
				js.push(name + "[" + quote(definition.name) + "] = " + JSON.stringify(value, null, 2) + ";");
				break;
			}
			case "STRUCT":
			case "MESSAGE":
				js.push("");
				js.push(name + "[" + quote("decode" + definition.name) + "] = " + compileDecode(definition, definitions) + ";");
				js.push("");
				js.push(name + "[" + quote("encode" + definition.name) + "] = " + compileEncode(definition, definitions) + ";");
				break;
			default:
				error("Invalid definition kind " + quote(definition.kind), definition.line, definition.column);
				break;
		}
	}
	js.push("");
	return js.join("\n");
}
function compileSchema(schema) {
	let result = { ByteBuffer };
	new Function("exports", compileSchemaJS(schema))(result);
	return result;
}
//#endregion
//#region src/schema-runtime/binary.ts
let types = [
	"bool",
	"byte",
	"int",
	"uint",
	"float",
	"string",
	"int64",
	"uint64"
];
let kinds = [
	"ENUM",
	"STRUCT",
	"MESSAGE"
];
function decodeBinarySchema(buffer) {
	let bb = buffer instanceof ByteBuffer ? buffer : new ByteBuffer(buffer);
	let definitionCount = bb.readVarUint();
	let definitions = [];
	for (let i = 0; i < definitionCount; i++) {
		let definitionName = bb.readString();
		let kind = bb.readByte();
		let fieldCount = bb.readVarUint();
		let fields = [];
		for (let j = 0; j < fieldCount; j++) {
			let fieldName = bb.readString();
			let type = bb.readVarInt();
			let isArray = !!(bb.readByte() & 1);
			let value = bb.readVarUint();
			fields.push({
				name: fieldName,
				line: 0,
				column: 0,
				type: kinds[kind] === "ENUM" ? null : type,
				isArray,
				isDeprecated: false,
				value
			});
		}
		definitions.push({
			name: definitionName,
			line: 0,
			column: 0,
			kind: kinds[kind],
			fields
		});
	}
	for (let i = 0; i < definitionCount; i++) {
		let fields = definitions[i].fields;
		for (let j = 0; j < fields.length; j++) {
			let field = fields[j];
			let type = field.type;
			if (type !== null && type < 0) {
				if (~type >= types.length) throw new Error("Invalid type " + type);
				field.type = types[~type];
			} else {
				if (type !== null && type >= definitions.length) throw new Error("Invalid type " + type);
				field.type = type === null ? null : definitions[type].name;
			}
		}
	}
	return {
		package: null,
		definitions
	};
}
function encodeBinarySchema(schema) {
	let bb = new ByteBuffer();
	let definitions = schema.definitions;
	let definitionIndex = {};
	bb.writeVarUint(definitions.length);
	for (let i = 0; i < definitions.length; i++) definitionIndex[definitions[i].name] = i;
	for (let i = 0; i < definitions.length; i++) {
		let definition = definitions[i];
		bb.writeString(definition.name);
		bb.writeByte(kinds.indexOf(definition.kind));
		bb.writeVarUint(definition.fields.length);
		for (let j = 0; j < definition.fields.length; j++) {
			let field = definition.fields[j];
			let type = types.indexOf(field.type);
			bb.writeString(field.name);
			bb.writeVarInt(type === -1 ? definitionIndex[field.type] : ~type);
			bb.writeByte(field.isArray ? 1 : 0);
			bb.writeVarUint(field.value);
		}
	}
	return bb.toUint8Array();
}
//#endregion
//#region src/schema-runtime/parser.ts
let nativeTypes = [
	"bool",
	"byte",
	"float",
	"int",
	"int64",
	"string",
	"uint",
	"uint64"
];
let reservedNames = ["ByteBuffer", "package"];
let regex = /((?:-|\b)\d+\b|[=;{}]|\[\]|\[deprecated\]|\b[A-Za-z_][A-Za-z0-9_]*\b|\/\/.*|\s+)/g;
let identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;
let whitespace = /^\/\/.*|\s+$/;
let equals = /^=$/;
let endOfFile = /^$/;
let semicolon = /^;$/;
let integer = /^-?\d+$/;
let leftBrace = /^\{$/;
let rightBrace = /^\}$/;
let arrayToken = /^\[\]$/;
let enumKeyword = /^enum$/;
let structKeyword = /^struct$/;
let messageKeyword = /^message$/;
let packageKeyword = /^package$/;
let deprecatedToken = /^\[deprecated\]$/;
function tokenize(text) {
	let parts = text.split(regex);
	let tokens = [];
	let column = 0;
	let line = 0;
	for (let i = 0; i < parts.length; i++) {
		let part = parts[i];
		if (i & 1) {
			if (!whitespace.test(part)) tokens.push({
				text: part,
				line: line + 1,
				column: column + 1
			});
		} else if (part !== "") error("Syntax error " + quote(part), line + 1, column + 1);
		let lines = part.split("\n");
		if (lines.length > 1) column = 0;
		line += lines.length - 1;
		column += lines[lines.length - 1].length;
	}
	tokens.push({
		text: "",
		line,
		column
	});
	return tokens;
}
function parse(tokens) {
	function current() {
		return tokens[index];
	}
	function eat(test) {
		if (test.test(current().text)) {
			index++;
			return true;
		}
		return false;
	}
	function expect(test, expected) {
		if (!eat(test)) {
			let token = current();
			error("Expected " + expected + " but found " + quote(token.text), token.line, token.column);
		}
	}
	function unexpectedToken() {
		let token = current();
		error("Unexpected token " + quote(token.text), token.line, token.column);
	}
	let definitions = [];
	let packageText = null;
	let index = 0;
	if (eat(packageKeyword)) {
		packageText = current().text;
		expect(identifier, "identifier");
		expect(semicolon, "\";\"");
	}
	while (index < tokens.length && !eat(endOfFile)) {
		let fields = [];
		let kind;
		if (eat(enumKeyword)) kind = "ENUM";
		else if (eat(structKeyword)) kind = "STRUCT";
		else if (eat(messageKeyword)) kind = "MESSAGE";
		else unexpectedToken();
		let name = current();
		expect(identifier, "identifier");
		expect(leftBrace, "\"{\"");
		while (!eat(rightBrace)) {
			let type = null;
			let isArray = false;
			let isDeprecated = false;
			if (kind !== "ENUM") {
				type = current().text;
				expect(identifier, "identifier");
				isArray = eat(arrayToken);
			}
			let field = current();
			expect(identifier, "identifier");
			let value = null;
			if (kind !== "STRUCT") {
				expect(equals, "\"=\"");
				value = current();
				expect(integer, "integer");
				if ((+value.text | 0) + "" !== value.text) error("Invalid integer " + quote(value.text), value.line, value.column);
			}
			let deprecated = current();
			if (eat(deprecatedToken)) {
				if (kind !== "MESSAGE") error("Cannot deprecate this field", deprecated.line, deprecated.column);
				isDeprecated = true;
			}
			expect(semicolon, "\";\"");
			fields.push({
				name: field.text,
				line: field.line,
				column: field.column,
				type,
				isArray,
				isDeprecated,
				value: value !== null ? +value.text | 0 : fields.length + 1
			});
		}
		definitions.push({
			name: name.text,
			line: name.line,
			column: name.column,
			kind,
			fields
		});
	}
	return {
		package: packageText,
		definitions
	};
}
function verify(root) {
	let definedTypes = nativeTypes.slice();
	let definitions = {};
	for (let i = 0; i < root.definitions.length; i++) {
		let definition = root.definitions[i];
		if (definedTypes.includes(definition.name)) error("The type " + quote(definition.name) + " is defined twice", definition.line, definition.column);
		if (reservedNames.includes(definition.name)) error("The type name " + quote(definition.name) + " is reserved", definition.line, definition.column);
		definedTypes.push(definition.name);
		definitions[definition.name] = definition;
	}
	for (let i = 0; i < root.definitions.length; i++) {
		let definition = root.definitions[i];
		let fields = definition.fields;
		if (definition.kind === "ENUM" || fields.length === 0) continue;
		for (let j = 0; j < fields.length; j++) {
			let field = fields[j];
			if (!definedTypes.includes(field.type)) error("The type " + quote(field.type) + " is not defined for field " + quote(field.name), field.line, field.column);
		}
		let values = [];
		for (let j = 0; j < fields.length; j++) {
			let field = fields[j];
			if (values.includes(field.value)) error("The id for field " + quote(field.name) + " is used twice", field.line, field.column);
			if (field.value <= 0) error("The id for field " + quote(field.name) + " must be positive", field.line, field.column);
			values.push(field.value);
		}
	}
	let state = {};
	let check = (name) => {
		let definition = definitions[name];
		if (definition && definition.kind === "STRUCT") {
			if (state[name] === 1) error("Recursive nesting of " + quote(name) + " is not allowed", definition.line, definition.column);
			if (state[name] !== 2 && definition) {
				state[name] = 1;
				let fields = definition.fields;
				for (let i = 0; i < fields.length; i++) {
					let field = fields[i];
					if (!field.isArray) check(field.type);
				}
				state[name] = 2;
			}
		}
		return true;
	};
	for (let i = 0; i < root.definitions.length; i++) check(root.definitions[i].name);
}
function parseSchema(text) {
	let schema = parse(tokenize(text));
	verify(schema);
	return schema;
}
//#endregion
//#region src/schema-runtime/validate.ts
function findDefinition(schema, name) {
	return schema.definitions.find((definition) => definition.name === name) ?? null;
}
function findField(schema, definitionName, fieldName) {
	return findDefinition(schema, definitionName)?.fields.find((field) => field.name === fieldName) ?? null;
}
function expectFieldNumber(schema, definitionName, fieldName, expectedValue) {
	const field = findField(schema, definitionName, fieldName);
	if (!field) throw new Error(`Missing field ${definitionName}.${fieldName}`);
	if (field.value !== expectedValue) throw new Error(`Expected ${definitionName}.${fieldName} to use field ${expectedValue}, got ${field.value}`);
}
function expectEnumValue(schema, enumName, memberName, expectedValue) {
	const definition = findDefinition(schema, enumName);
	if (!definition) throw new Error(`Missing enum ${enumName}`);
	if (definition.kind !== "ENUM") throw new Error(`${enumName} is a ${definition.kind}, not an enum`);
	const field = definition.fields.find((candidate) => candidate.name === memberName);
	if (!field) throw new Error(`Missing enum member ${enumName}.${memberName}`);
	if (field.value !== expectedValue) throw new Error(`Expected ${enumName}.${memberName} to use value ${expectedValue}, got ${field.value}`);
}
function validateSchema(schema) {
	for (const definition of schema.definitions) {
		validateUniqueFieldNames(definition);
		if (definition.kind === "ENUM") validateUniqueEnumValues(definition);
	}
}
function validateUniqueFieldNames(definition) {
	const fieldsByName = /* @__PURE__ */ new Set();
	for (const field of definition.fields) {
		if (fieldsByName.has(field.name)) error(`The field ${quote(field.name)} is defined twice in ${quote(definition.name)}`, field.line, field.column);
		fieldsByName.add(field.name);
	}
}
function validateUniqueEnumValues(definition) {
	const fieldsByValue = /* @__PURE__ */ new Set();
	for (const field of definition.fields) {
		if (fieldsByValue.has(field.value)) error(`The enum value ${field.value} is used twice in ${quote(definition.name)}`, field.line, field.column);
		fieldsByValue.add(field.value);
	}
}
//#endregion
//#region src/fig/schema.ts
const schema = parseSchema("enum MessageType {\n  JOIN_START = 0;\n  NODE_CHANGES = 1;\n  USER_CHANGES = 2;\n  JOIN_END = 3;\n  SIGNAL = 4;\n  STYLE = 5;\n  STYLE_SET = 6;\n  JOIN_START_SKIP_RELOAD = 7;\n  NOTIFY_SHOULD_UPGRADE = 8;\n  UPGRADE_DONE = 9;\n  UPGRADE_REFRESH = 10;\n  SCENE_GRAPH_QUERY = 11;\n  SCENE_GRAPH_REPLY = 12;\n  DIFF = 13;\n  CLIENT_BROADCAST = 14;\n  JOIN_START_JOURNALED = 15;\n  STREAM_START = 16;\n  STREAM_END = 17;\n  INTERACTIVE_SLIDE_CHANGE = 18;\n  RECONNECT_SCENE_GRAPH_QUERY = 19;\n  RECONNECT_SCENE_GRAPH_REPLY = 20;\n  JOIN_END_INCREMENTAL_RECONNECT = 21;\n  NODE_STATUS_CHANGE = 22;\n  CLIENT_RENDERED = 23;\n  BUZZ_APPROVAL_CHANGE = 24;\n}\n\nenum Axis {\n  X = 0;\n  Y = 1;\n}\n\nenum Access {\n  READ_ONLY = 0;\n  READ_WRITE = 1;\n}\n\nenum NodePhase {\n  CREATED = 0;\n  REMOVED = 1;\n}\n\nenum WindingRule {\n  NONZERO = 0;\n  ODD = 1;\n}\n\nenum NodeType {\n  NONE = 0;\n  DOCUMENT = 1;\n  CANVAS = 2;\n  GROUP = 3;\n  FRAME = 4;\n  BOOLEAN_OPERATION = 5;\n  VECTOR = 6;\n  STAR = 7;\n  LINE = 8;\n  ELLIPSE = 9;\n  RECTANGLE = 10;\n  REGULAR_POLYGON = 11;\n  ROUNDED_RECTANGLE = 12;\n  TEXT = 13;\n  SLICE = 14;\n  SYMBOL = 15;\n  INSTANCE = 16;\n  STICKY = 17;\n  SHAPE_WITH_TEXT = 18;\n  CONNECTOR = 19;\n  CODE_BLOCK = 20;\n  WIDGET = 21;\n  STAMP = 22;\n  MEDIA = 23;\n  HIGHLIGHT = 24;\n  SECTION = 25;\n  SECTION_OVERLAY = 26;\n  WASHI_TAPE = 27;\n  VARIABLE = 28;\n  TABLE = 29;\n  TABLE_CELL = 30;\n  VARIABLE_SET = 31;\n  SLIDE = 32;\n  ASSISTED_LAYOUT = 33;\n  INTERACTIVE_SLIDE_ELEMENT = 34;\n  VARIABLE_OVERRIDE = 35;\n  MODULE = 36;\n  SLIDE_GRID = 37;\n  SLIDE_ROW = 38;\n  RESPONSIVE_SET = 39;\n  CODE_COMPONENT = 40;\n  TEXT_PATH = 41;\n  CODE_INSTANCE = 42;\n  CODE_LIBRARY = 43;\n  CODE_FILE = 44;\n  CODE_LAYER = 45;\n  BRUSH = 46;\n  MANAGED_STRING = 47;\n  TRANSFORM = 48;\n  CMS_RICH_TEXT = 49;\n  REPEATER = 50;\n  JSX = 51;\n  EMBEDDED_PROTOTYPE = 52;\n  REACT_FIBER = 53;\n  RESPONSIVE_NODE_SET = 54;\n  WEBPAGE = 55;\n  KEYFRAME = 56;\n  KEYFRAME_TRACK = 57;\n  ANIMATION_PRESET_INSTANCE = 58;\n  CODE_EMBED = 59;\n  BINARY_FILE = 60;\n  SPEC_BLOCK = 61;\n  TOOL_INSTANCE = 62;\n  CUSTOM_EFFECT_INSTANCE = 63;\n  NATIVE_CODE_LAYER_INSTANCE = 64;\n}\n\nenum ShapeWithTextType {\n  SQUARE = 0;\n  ELLIPSE = 1;\n  DIAMOND = 2;\n  TRIANGLE_UP = 3;\n  TRIANGLE_DOWN = 4;\n  ROUNDED_RECTANGLE = 5;\n  PARALLELOGRAM_RIGHT = 6;\n  PARALLELOGRAM_LEFT = 7;\n  ENG_DATABASE = 8;\n  ENG_QUEUE = 9;\n  ENG_FILE = 10;\n  ENG_FOLDER = 11;\n  TRAPEZOID = 12;\n  PREDEFINED_PROCESS = 13;\n  SHIELD = 14;\n  DOCUMENT_SINGLE = 15;\n  DOCUMENT_MULTIPLE = 16;\n  MANUAL_INPUT = 17;\n  HEXAGON = 18;\n  CHEVRON = 19;\n  PENTAGON = 20;\n  OCTAGON = 21;\n  STAR = 22;\n  PLUS = 23;\n  ARROW_LEFT = 24;\n  ARROW_RIGHT = 25;\n  SUMMING_JUNCTION = 26;\n  OR = 27;\n  SPEECH_BUBBLE = 28;\n  INTERNAL_STORAGE = 29;\n}\n\nenum BlendMode {\n  PASS_THROUGH = 0;\n  NORMAL = 1;\n  DARKEN = 2;\n  MULTIPLY = 3;\n  LINEAR_BURN = 4;\n  COLOR_BURN = 5;\n  LIGHTEN = 6;\n  SCREEN = 7;\n  LINEAR_DODGE = 8;\n  COLOR_DODGE = 9;\n  OVERLAY = 10;\n  SOFT_LIGHT = 11;\n  HARD_LIGHT = 12;\n  DIFFERENCE = 13;\n  EXCLUSION = 14;\n  HUE = 15;\n  SATURATION = 16;\n  COLOR = 17;\n  LUMINOSITY = 18;\n}\n\nenum PaintType {\n  SOLID = 0;\n  GRADIENT_LINEAR = 1;\n  GRADIENT_RADIAL = 2;\n  GRADIENT_ANGULAR = 3;\n  GRADIENT_DIAMOND = 4;\n  IMAGE = 5;\n  EMOJI = 6;\n  VIDEO = 7;\n  PATTERN = 8;\n  NOISE = 9;\n  CUSTOM = 10;\n}\n\nenum ImageScaleMode {\n  STRETCH = 0;\n  FIT = 1;\n  FILL = 2;\n  TILE = 3;\n}\n\nenum EffectType {\n  INNER_SHADOW = 0;\n  DROP_SHADOW = 1;\n  FOREGROUND_BLUR = 2;\n  BACKGROUND_BLUR = 3;\n  REPEAT = 4;\n  SYMMETRY = 5;\n  GRAIN = 6;\n  NOISE = 7;\n  GLASS = 8;\n  CUSTOM = 9;\n}\n\nenum TextCase {\n  ORIGINAL = 0;\n  UPPER = 1;\n  LOWER = 2;\n  TITLE = 3;\n  SMALL_CAPS = 4;\n  SMALL_CAPS_FORCED = 5;\n}\n\nenum TextDecoration {\n  NONE = 0;\n  UNDERLINE = 1;\n  STRIKETHROUGH = 2;\n}\n\nenum TextDecorationStyle {\n  SOLID = 0;\n  DOTTED = 1;\n  WAVY = 2;\n}\n\nenum LeadingTrim {\n  NONE = 0;\n  CAP_HEIGHT = 1;\n}\n\nenum NumberUnits {\n  RAW = 0;\n  PIXELS = 1;\n  PERCENT = 2;\n}\n\nenum ConstraintType {\n  MIN = 0;\n  CENTER = 1;\n  MAX = 2;\n  STRETCH = 3;\n  SCALE = 4;\n  FIXED_MIN = 5;\n  FIXED_MAX = 6;\n}\n\nenum StrokeAlign {\n  CENTER = 0;\n  INSIDE = 1;\n  OUTSIDE = 2;\n  OFFSET = 3;\n}\n\nenum StrokeCap {\n  NONE = 0;\n  ROUND = 1;\n  SQUARE = 2;\n  ARROW_LINES = 3;\n  ARROW_EQUILATERAL = 4;\n  DIAMOND_FILLED = 5;\n  TRIANGLE_FILLED = 6;\n  HIGHLIGHT = 7;\n  WASHI_TAPE_1 = 8;\n  WASHI_TAPE_2 = 9;\n  WASHI_TAPE_3 = 10;\n  WASHI_TAPE_4 = 11;\n  WASHI_TAPE_5 = 12;\n  WASHI_TAPE_6 = 13;\n  CIRCLE_FILLED = 14;\n  ERD_ZERO_OR_ONE = 15;\n  ERD_EXACTLY_ONE = 16;\n  ERD_ZERO_OR_MORE = 17;\n  ERD_ONE_OR_MORE = 18;\n  ERD_ONE = 19;\n  ERD_MANY = 20;\n}\n\nenum StrokeJoin {\n  MITER = 0;\n  BEVEL = 1;\n  ROUND = 2;\n}\n\nenum BooleanOperation {\n  UNION = 0;\n  INTERSECT = 1;\n  SUBTRACT = 2;\n  XOR = 3;\n}\n\nenum TextAlignHorizontal {\n  LEFT = 0;\n  CENTER = 1;\n  RIGHT = 2;\n  JUSTIFIED = 3;\n}\n\nenum TextAlignVertical {\n  TOP = 0;\n  CENTER = 1;\n  BOTTOM = 2;\n}\n\nenum MouseCursor {\n  DEFAULT = 0;\n  CROSSHAIR = 1;\n  EYEDROPPER = 2;\n  HAND = 3;\n  PAINT_BUCKET = 4;\n  PEN = 5;\n  PENCIL = 6;\n  MARKER = 7;\n  ERASER = 8;\n  HIGHLIGHTER = 9;\n  LASSO = 10;\n}\n\nenum VectorMirror {\n  NONE = 0;\n  ANGLE = 1;\n  ANGLE_AND_LENGTH = 2;\n}\n\nenum DashMode {\n  CLIP = 0;\n  STRETCH = 1;\n}\n\nenum ImageType {\n  PNG = 0;\n  JPEG = 1;\n  SVG = 2;\n  PDF = 3;\n  MP4 = 4;\n  GIF = 5;\n}\n\nenum ExportConstraintType {\n  CONTENT_SCALE = 0;\n  CONTENT_WIDTH = 1;\n  CONTENT_HEIGHT = 2;\n}\n\nenum LayoutGridType {\n  MIN = 0;\n  CENTER = 1;\n  STRETCH = 2;\n  MAX = 3;\n}\n\nenum LayoutGridPattern {\n  STRIPES = 0;\n  GRID = 1;\n}\n\nenum TextAutoResize {\n  NONE = 0;\n  WIDTH_AND_HEIGHT = 1;\n  HEIGHT = 2;\n}\n\nenum TextTruncation {\n  DISABLED = 0;\n  ENDING = 1;\n}\n\nenum StyleSetType {\n  PERSONAL = 0;\n  TEAM = 1;\n  CUSTOM = 2;\n  FREQUENCY = 3;\n  TEMPORARY = 4;\n}\n\nenum StyleSetContentType {\n  SOLID = 0;\n  GRADIENT = 1;\n  IMAGE = 2;\n}\n\nenum StackMode {\n  NONE = 0;\n  HORIZONTAL = 1;\n  VERTICAL = 2;\n  GRID = 3;\n}\n\nenum StackAlign {\n  MIN = 0;\n  CENTER = 1;\n  MAX = 2;\n  BASELINE = 3;\n}\n\nenum StackCounterAlign {\n  MIN = 0;\n  CENTER = 1;\n  MAX = 2;\n  STRETCH = 3;\n  AUTO = 4;\n  BASELINE = 5;\n}\n\nenum StackJustify {\n  MIN = 0;\n  CENTER = 1;\n  MAX = 2;\n  SPACE_EVENLY = 3;\n  SPACE_BETWEEN = 4;\n}\n\nenum GridChildAlign {\n  AUTO = 0;\n  MIN = 1;\n  CENTER = 2;\n  MAX = 3;\n}\n\nenum GridAutoTracks {\n  NONE = 0;\n  ROWS = 1;\n}\n\nenum StackSize {\n  FIXED = 0;\n  RESIZE_TO_FIT = 1;\n  RESIZE_TO_FIT_WITH_IMPLICIT_SIZE = 2;\n}\n\nenum StackPositioning {\n  AUTO = 0;\n  ABSOLUTE = 1;\n}\n\nenum StackWrap {\n  NO_WRAP = 0;\n  WRAP = 1;\n}\n\nenum StackCounterAlignContent {\n  AUTO = 0;\n  SPACE_BETWEEN = 1;\n}\n\nenum ConnectionType {\n  NONE = 0;\n  INTERNAL_NODE = 1;\n  URL = 2;\n  BACK = 3;\n  CLOSE = 4;\n  SET_VARIABLE = 5;\n  UPDATE_MEDIA_RUNTIME = 6;\n  CONDITIONAL = 7;\n  SET_VARIABLE_MODE = 8;\n  OBJECT_ANIMATION = 9;\n  UPDATE_ANIMATION_TIMELINE_STATE = 10;\n}\n\nenum InteractionType {\n  ON_CLICK = 0;\n  AFTER_TIMEOUT = 1;\n  MOUSE_IN = 2;\n  MOUSE_OUT = 3;\n  ON_HOVER = 4;\n  MOUSE_DOWN = 5;\n  MOUSE_UP = 6;\n  ON_PRESS = 7;\n  NONE = 8;\n  DRAG = 9;\n  ON_KEY_DOWN = 10;\n  ON_VOICE = 11;\n  ON_MEDIA_HIT = 12;\n  ON_MEDIA_END = 13;\n  MOUSE_ENTER = 14;\n  MOUSE_LEAVE = 15;\n}\n\nenum TransitionType {\n  INSTANT_TRANSITION = 0;\n  DISSOLVE = 1;\n  FADE = 2;\n  SLIDE_FROM_LEFT = 3;\n  SLIDE_FROM_RIGHT = 4;\n  SLIDE_FROM_TOP = 5;\n  SLIDE_FROM_BOTTOM = 6;\n  PUSH_FROM_LEFT = 7;\n  PUSH_FROM_RIGHT = 8;\n  PUSH_FROM_TOP = 9;\n  PUSH_FROM_BOTTOM = 10;\n  MOVE_FROM_LEFT = 11;\n  MOVE_FROM_RIGHT = 12;\n  MOVE_FROM_TOP = 13;\n  MOVE_FROM_BOTTOM = 14;\n  SLIDE_OUT_TO_LEFT = 15;\n  SLIDE_OUT_TO_RIGHT = 16;\n  SLIDE_OUT_TO_TOP = 17;\n  SLIDE_OUT_TO_BOTTOM = 18;\n  MOVE_OUT_TO_LEFT = 19;\n  MOVE_OUT_TO_RIGHT = 20;\n  MOVE_OUT_TO_TOP = 21;\n  MOVE_OUT_TO_BOTTOM = 22;\n  MAGIC_MOVE = 23;\n  SMART_ANIMATE = 24;\n  SCROLL_ANIMATE = 25;\n}\n\nenum EasingType {\n  IN_CUBIC = 0;\n  OUT_CUBIC = 1;\n  INOUT_CUBIC = 2;\n  LINEAR = 3;\n  IN_BACK_CUBIC = 4;\n  OUT_BACK_CUBIC = 5;\n  INOUT_BACK_CUBIC = 6;\n  CUSTOM_CUBIC = 7;\n  SPRING = 8;\n  GENTLE_SPRING = 9;\n  CUSTOM_SPRING = 10;\n  SPRING_PRESET_ONE = 11;\n  SPRING_PRESET_TWO = 12;\n  SPRING_PRESET_THREE = 13;\n  HOLD = 14;\n}\n\nenum ScrollDirection {\n  NONE = 0;\n  HORIZONTAL = 1;\n  VERTICAL = 2;\n  BOTH = 3;\n}\n\nenum ScrollContractedState {\n  EXPANDED = 0;\n  CONTRACTED = 1;\n}\n\nstruct GUID {\n  uint sessionID;\n  uint localID;\n}\n\nstruct Color {\n  float r;\n  float g;\n  float b;\n  float a;\n}\n\nstruct Vector {\n  float x;\n  float y;\n}\n\nstruct Rect {\n  float x;\n  float y;\n  float w;\n  float h;\n}\n\nstruct ColorStop {\n  Color color;\n  float position;\n}\n\nmessage ColorStopVar {\n  Color color = 1;\n  VariableData colorVar = 2;\n  float position = 3;\n}\n\nstruct Matrix {\n  float m00;\n  float m01;\n  float m02;\n  float m10;\n  float m11;\n  float m12;\n}\n\nstruct ParentIndex {\n  GUID guid;\n  string position;\n}\n\nstruct Number {\n  float value;\n  NumberUnits units;\n}\n\nstruct FontName {\n  string family;\n  string style;\n  string postscript;\n}\n\nenum FontVariantNumericFigure {\n  NORMAL = 0;\n  LINING = 1;\n  OLDSTYLE = 2;\n}\n\nenum FontVariantNumericSpacing {\n  NORMAL = 0;\n  PROPORTIONAL = 1;\n  TABULAR = 2;\n}\n\nenum FontVariantNumericFraction {\n  NORMAL = 0;\n  DIAGONAL = 1;\n  STACKED = 2;\n}\n\nenum FontVariantCaps {\n  NORMAL = 0;\n  SMALL = 1;\n  ALL_SMALL = 2;\n  PETITE = 3;\n  ALL_PETITE = 4;\n  UNICASE = 5;\n  TITLING = 6;\n}\n\nenum FontVariantPosition {\n  NORMAL = 0;\n  SUB = 1;\n  SUPER = 2;\n}\n\nenum FontStyle {\n  NORMAL = 0;\n  ITALIC = 1;\n}\n\nenum SemanticWeight {\n  NORMAL = 0;\n  BOLD = 1;\n}\n\nenum SemanticItalic {\n  NORMAL = 0;\n  ITALIC = 1;\n}\n\nenum CodeSnapshotState {\n  INITIAL = 0;\n  SNAPSHOTTING = 1;\n  OK = 2;\n  SNAPSHOT_ERROR = 3;\n  LLM_IN_PROGRESS = 4;\n}\n\nenum SnapshotCaptureMode {\n  FULL = 0;\n  PARTIAL = 1;\n}\n\nmessage CodeSourceInfo {\n  string originReferenceId = 1;\n  GUID originNodeId = 2;\n  GUID linkedSnapshotId = 3;\n  SnapshotCaptureMode captureMode = 4;\n  string sourceBlobRef = 5;\n  string sourceElementId = 6;\n}\n\nenum CodeObjectType {\n  WEB_LAYER = 0;\n  WEB_INTERACTION = 1;\n  NATIVE_LAYER = 2;\n  ANIMATION_PRESET = 3;\n  TOOL = 4;\n  CUSTOM_EFFECT = 5;\n  PLUGIN = 6;\n  WEB_LAYER_GENERIC = 7;\n  CUSTOM_FILL = 8;\n}\n\nmessage CustomToolArtifactRef {\n  string customToolId = 1;\n  string customToolVersion = 2;\n  string publishedCustomToolId = 3;\n  string publishedCustomToolVersionId = 4;\n}\n\nenum LockMode {\n  NONE = 0;\n  ALL = 1;\n  BACKGROUND_ONLY = 2;\n}\n\nenum OpenTypeFeature {\n  PCAP = 0;\n  C2PC = 1;\n  CASE = 2;\n  CPSP = 3;\n  TITL = 4;\n  UNIC = 5;\n  ZERO = 6;\n  SINF = 7;\n  ORDN = 8;\n  AFRC = 9;\n  DNOM = 10;\n  NUMR = 11;\n  LIGA = 12;\n  CLIG = 13;\n  DLIG = 14;\n  HLIG = 15;\n  RLIG = 16;\n  AALT = 17;\n  CALT = 18;\n  RCLT = 19;\n  SALT = 20;\n  RVRN = 21;\n  VERT = 22;\n  SWSH = 23;\n  CSWH = 24;\n  NALT = 25;\n  CCMP = 26;\n  STCH = 27;\n  HIST = 28;\n  SIZE = 29;\n  ORNM = 30;\n  ITAL = 31;\n  RAND = 32;\n  DTLS = 33;\n  FLAC = 34;\n  MGRK = 35;\n  SSTY = 36;\n  KERN = 37;\n  FWID = 38;\n  HWID = 39;\n  HALT = 40;\n  TWID = 41;\n  QWID = 42;\n  PWID = 43;\n  JUST = 44;\n  LFBD = 45;\n  OPBD = 46;\n  RTBD = 47;\n  PALT = 48;\n  PKNA = 49;\n  LTRA = 50;\n  LTRM = 51;\n  RTLA = 52;\n  RTLM = 53;\n  ABRV = 54;\n  ABVM = 55;\n  ABVS = 56;\n  VALT = 57;\n  VHAL = 58;\n  BLWF = 59;\n  BLWM = 60;\n  BLWS = 61;\n  AKHN = 62;\n  CJCT = 63;\n  CFAR = 64;\n  CPCT = 65;\n  CURS = 66;\n  DIST = 67;\n  EXPT = 68;\n  FALT = 69;\n  FINA = 70;\n  FIN2 = 71;\n  FIN3 = 72;\n  HALF = 73;\n  HALN = 74;\n  HKNA = 75;\n  HNGL = 76;\n  HOJO = 77;\n  INIT = 78;\n  ISOL = 79;\n  JP78 = 80;\n  JP83 = 81;\n  JP90 = 82;\n  JP04 = 83;\n  LJMO = 84;\n  LOCL = 85;\n  MARK = 86;\n  MEDI = 87;\n  MED2 = 88;\n  MKMK = 89;\n  NLCK = 90;\n  NUKT = 91;\n  PREF = 92;\n  PRES = 93;\n  VPAL = 94;\n  PSTF = 95;\n  PSTS = 96;\n  RKRF = 97;\n  RPHF = 98;\n  RUBY = 99;\n  SMPL = 100;\n  TJMO = 101;\n  TNAM = 102;\n  TRAD = 103;\n  VATU = 104;\n  VJMO = 105;\n  VKNA = 106;\n  VKRN = 107;\n  VRTR = 108;\n  VRT2 = 109;\n  SS01 = 110;\n  SS02 = 111;\n  SS03 = 112;\n  SS04 = 113;\n  SS05 = 114;\n  SS06 = 115;\n  SS07 = 116;\n  SS08 = 117;\n  SS09 = 118;\n  SS10 = 119;\n  SS11 = 120;\n  SS12 = 121;\n  SS13 = 122;\n  SS14 = 123;\n  SS15 = 124;\n  SS16 = 125;\n  SS17 = 126;\n  SS18 = 127;\n  SS19 = 128;\n  SS20 = 129;\n  CV01 = 130;\n  CV02 = 131;\n  CV03 = 132;\n  CV04 = 133;\n  CV05 = 134;\n  CV06 = 135;\n  CV07 = 136;\n  CV08 = 137;\n  CV09 = 138;\n  CV10 = 139;\n  CV11 = 140;\n  CV12 = 141;\n  CV13 = 142;\n  CV14 = 143;\n  CV15 = 144;\n  CV16 = 145;\n  CV17 = 146;\n  CV18 = 147;\n  CV19 = 148;\n  CV20 = 149;\n  CV21 = 150;\n  CV22 = 151;\n  CV23 = 152;\n  CV24 = 153;\n  CV25 = 154;\n  CV26 = 155;\n  CV27 = 156;\n  CV28 = 157;\n  CV29 = 158;\n  CV30 = 159;\n  CV31 = 160;\n  CV32 = 161;\n  CV33 = 162;\n  CV34 = 163;\n  CV35 = 164;\n  CV36 = 165;\n  CV37 = 166;\n  CV38 = 167;\n  CV39 = 168;\n  CV40 = 169;\n  CV41 = 170;\n  CV42 = 171;\n  CV43 = 172;\n  CV44 = 173;\n  CV45 = 174;\n  CV46 = 175;\n  CV47 = 176;\n  CV48 = 177;\n  CV49 = 178;\n  CV50 = 179;\n  CV51 = 180;\n  CV52 = 181;\n  CV53 = 182;\n  CV54 = 183;\n  CV55 = 184;\n  CV56 = 185;\n  CV57 = 186;\n  CV58 = 187;\n  CV59 = 188;\n  CV60 = 189;\n  CV61 = 190;\n  CV62 = 191;\n  CV63 = 192;\n  CV64 = 193;\n  CV65 = 194;\n  CV66 = 195;\n  CV67 = 196;\n  CV68 = 197;\n  CV69 = 198;\n  CV70 = 199;\n  CV71 = 200;\n  CV72 = 201;\n  CV73 = 202;\n  CV74 = 203;\n  CV75 = 204;\n  CV76 = 205;\n  CV77 = 206;\n  CV78 = 207;\n  CV79 = 208;\n  CV80 = 209;\n  CV81 = 210;\n  CV82 = 211;\n  CV83 = 212;\n  CV84 = 213;\n  CV85 = 214;\n  CV86 = 215;\n  CV87 = 216;\n  CV88 = 217;\n  CV89 = 218;\n  CV90 = 219;\n  CV91 = 220;\n  CV92 = 221;\n  CV93 = 222;\n  CV94 = 223;\n  CV95 = 224;\n  CV96 = 225;\n  CV97 = 226;\n  CV98 = 227;\n  CV99 = 228;\n}\n\nstruct ExportConstraint {\n  ExportConstraintType type;\n  float value;\n}\n\nstruct GUIDMapping {\n  GUID from;\n  GUID to;\n}\n\nstruct Blob {\n  byte[] bytes;\n}\n\nmessage Image {\n  byte[] hash = 1;\n  string name = 2;\n  uint dataBlob = 3;\n}\n\nmessage Video {\n  byte[] hash = 1;\n  string s3Url = 2;\n}\n\nmessage PasteSource {\n  string srcFile = 1;\n  GUID srcNode = 2;\n}\n\nstruct FilterColorAdjust {\n  float tint;\n  float shadows;\n  float highlights;\n  float detail;\n  float exposure;\n  float vignette;\n  float temperature;\n  float vibrance;\n}\n\nmessage PaintFilterMessage {\n  float tint = 1;\n  float shadows = 2;\n  float highlights = 3;\n  float detail = 4;\n  float exposure = 5;\n  float vignette = 6;\n  float temperature = 7;\n  float vibrance = 8;\n  float contrast = 9;\n  float brightness = 10;\n}\n\nmessage Paint {\n  PaintType type = 1;\n  Color color = 2;\n  float opacity = 3;\n  bool visible = 4;\n  BlendMode blendMode = 5;\n  ColorStop[] stops = 6;\n  Matrix transform = 7;\n  Image image = 8;\n  Image imageThumbnail = 9;\n  Image animatedImage = 16;\n  uint animationFrame = 17;\n  ImageScaleMode imageScaleMode = 10;\n  bool imageShouldColorManage = 22;\n  float rotation = 11;\n  float scale = 12;\n  FilterColorAdjust filterColorAdjust = 13;\n  PaintFilterMessage paintFilter = 14;\n  uint[] emojiCodePoints = 15;\n  Video video = 18;\n  uint originalImageWidth = 19;\n  uint originalImageHeight = 20;\n  VariableData opacityVar = 38;\n  VariableData colorVar = 21;\n  VariableData imageVar = 31;\n  ColorStopVar[] stopsVar = 23;\n  string thumbHashBase64 = 24;\n  byte[] thumbHash = 25;\n  GUID sourceNodeId = 26;\n  float spacing = 27;\n  Vector patternSpacing = 37;\n  PatternTileType patternTileType = 28;\n  PatternAlignment verticalAlignment = 29;\n  PatternAlignment horizontalAlignment = 30;\n  GUID id = 32;\n  string altText = 33;\n  NoiseType noiseType = 34;\n  float density = 35;\n  Vector noiseSize = 36;\n  CodeComponentId customEffectId = 39;\n  ComponentPropAssignment[] componentPropAssignments = 40;\n}\n\nenum NoiseType {\n  MULTITONE = 0;\n  MONOTONE = 1;\n  DUOTONE = 2;\n}\n\nenum PatternTileType {\n  RECTANGULAR = 0;\n  HORIZONTAL_HEXAGONAL = 1;\n  VERTICAL_HEXAGONAL = 2;\n}\n\nenum PatternAlignment {\n  START = 0;\n  CENTER = 1;\n  END = 2;\n}\n\nmessage FontMetaData {\n  FontName key = 1;\n  float fontLineHeight = 2;\n  byte[] fontDigest = 3;\n  FontStyle fontStyle = 4;\n  int fontWeight = 5;\n}\n\nmessage FontVariation {\n  uint axisTag = 1;\n  string axisName = 2;\n  float value = 3;\n}\n\nmessage TextData {\n  string characters = 1;\n  uint[] characterStyleIDs = 2;\n  NodeChange[] styleOverrideTable = 3;\n  TextLineData[] lines = 12;\n  uint layoutVersion = 8;\n  FontName[] fallbackFonts = 10;\n  float minContentHeight = 17;\n  Vector layoutSize = 4;\n  Baseline[] baselines = 5;\n  Glyph[] glyphs = 6;\n  Decoration[] decorations = 7;\n  Blockquote[] blockquotes = 16;\n  FontMetaData[] fontMetaData = 9;\n  HyperlinkBox[] hyperlinkBoxes = 11;\n  int truncationStartIndex = 13;\n  float truncatedHeight = 14;\n  float[] logicalIndexToCharacterOffsetMap = 15;\n  MentionBox[] mentionBoxes = 18;\n  DerivedTextLineData[] derivedLines = 19;\n}\n\nmessage DerivedTextData {\n  Vector layoutSize = 1;\n  Baseline[] baselines = 2;\n  Glyph[] glyphs = 3;\n  Decoration[] decorations = 4;\n  Blockquote[] blockquotes = 5;\n  FontMetaData[] fontMetaData = 6;\n  HyperlinkBox[] hyperlinkBoxes = 7;\n  int truncationStartIndex = 8;\n  float truncatedHeight = 9;\n  float[] logicalIndexToCharacterOffsetMap = 10;\n  MentionBox[] mentionBoxes = 11;\n  DerivedTextLineData[] derivedLines = 12;\n}\n\nmessage HyperlinkBox {\n  Rect bounds = 1;\n  string url = 2;\n  GUID guid = 3;\n  CMSItemPageTarget cmsTarget = 5;\n  bool openInNewTab = 6;\n  int hyperlinkID = 4;\n}\n\nmessage MentionBox {\n  Rect bounds = 1;\n  uint startIndex = 2;\n  uint endIndex = 3;\n  bool isValid = 4;\n  uint mentionKey = 5;\n}\n\nmessage Baseline {\n  Vector position = 1;\n  float width = 2;\n  float lineY = 3;\n  float lineHeight = 4;\n  float lineAscent = 7;\n  float ignoreLeadingTrim = 8;\n  uint firstCharacter = 5;\n  uint endCharacter = 6;\n}\n\nmessage Glyph {\n  uint commandsBlob = 1;\n  Vector position = 2;\n  uint styleID = 3;\n  float fontSize = 4;\n  uint firstCharacter = 5;\n  float advance = 6;\n  uint[] emojiCodePoints = 7;\n  EmojiImageSet emojiImageSet = 8;\n  float rotation = 9;\n}\n\nmessage Decoration {\n  Rect[] rects = 1;\n  uint styleID = 2;\n}\n\nmessage Blockquote {\n  Rect verticalBar = 1;\n  Rect quoteMarkBounds = 2;\n  uint styleID = 3;\n}\n\nmessage VectorData {\n  uint vectorNetworkBlob = 1;\n  Vector normalizedSize = 2;\n  NodeChange[] styleOverrideTable = 3;\n}\n\nmessage TextPathStart {\n  float tValue = 1;\n  bool forward = 2;\n}\n\nmessage GUIDPath {\n  GUID[] guids = 1;\n}\n\nmessage SymbolData {\n  GUID symbolID = 1;\n  NodeChange[] symbolOverrides = 2;\n  float uniformScaleFactor = 3;\n}\n\nmessage GUIDPathMapping {\n  GUID id = 1;\n  GUIDPath path = 2;\n}\n\nmessage DerivedBreakpointData {\n  NodeChange[] overrides = 1;\n}\n\nmessage NodeGenerationData {\n  NodeChange[] overrides = 1;\n  bool useFineGrainedSyncing = 2;\n  NodeChange[] diffOnlyRemovals = 3;\n}\n\nmessage DerivedImmutableFrameData {\n  NodeChange[] overrides = 1;\n  uint version = 2;\n}\n\nmessage JsxData {\n  NodeChange[] overrides = 1;\n}\n\nmessage DerivedJsxData {\n  NodeChange[] overrides = 1;\n}\n\nmessage AssetIdMap {\n  AssetIdEntry[] entries = 1;\n}\n\nmessage AssetIdEntry {\n  string assetKey = 1;\n  AssetId assetId = 2;\n}\n\nmessage AssetRef {\n  string key = 1;\n  string version = 2;\n}\n\nmessage AssetId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n  StateGroupId stateGroupId = 3;\n  StyleId styleId = 4;\n  SymbolId symbolId = 5;\n  VariableID variableId = 6;\n  VariableSetID variableSetId = 7;\n}\n\nmessage StateGroupId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage StyleId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage SymbolId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage VariableID {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage VariableOverrideId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage VariableSetID {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage ModuleId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage ResponsiveSetId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage WebpageId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage ThemeID {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage CodeLibraryId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage CodeFileId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage CodeComponentId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage CanvasNodeId {\n  GUID guid = 1;\n  SymbolId symbolId = 2;\n  StateGroupId stateGroupId = 3;\n}\n\nstruct IndexRange {\n  uint startIndex;\n  uint endIndexExclusive;\n}\n\nstruct CollaborativeTextOpID {\n  uint sessionID;\n  uint counterID;\n}\n\nenum CollaborativeTextOpType {\n  INSERT = 0;\n  DELETE = 1;\n}\n\nmessage CollaborativeTextStrippedOpRunWithIDs {\n  CollaborativeTextOpID firstId = 1;\n  uint runLength = 2;\n  CollaborativeTextOpID[] parentIds = 3;\n  CollaborativeTextOpID[] rebasedOnOpIds = 4;\n}\n\nmessage CollaborativeTextStrippedOpRunWithLoc {\n  CollaborativeTextOpType type = 1;\n  IndexRange range = 2;\n  bool rangeShouldBeIteratedInReverse = 3;\n  IndexRange contentBytesInBuffer = 4;\n  IndexRange rebasedRange = 5;\n}\n\nmessage CollaborativeTextOpRun {\n  CollaborativeTextOpID id = 1;\n  CollaborativeTextOpID[] parentIds = 2;\n  CollaborativeTextOpType type = 3;\n  IndexRange range = 4;\n  bool rangeShouldBeIteratedInReverse = 5;\n  string content = 6;\n  CollaborativeTextOpID[] rebasedOnOpIds = 7;\n  IndexRange rebasedRange = 8;\n}\n\nmessage CollaborativePlainText {\n  CollaborativeTextStrippedOpRunWithIDs[] historyOpsWithIds = 1;\n  CollaborativeTextStrippedOpRunWithLoc[] historyOpsWithLoc = 2;\n  byte[] historyStringContentBuffer = 3;\n  CollaborativeTextOpRun[] changesToAppend = 4;\n}\n\nmessage CollaborativeTextSelection {\n  GUID node = 1;\n  uint field = 2;\n  IndexRange selectedRange = 3;\n  bool caretAtFront = 4;\n  CollaborativeTextOpID[] textVersion = 5;\n}\n\nmessage ResponsiveTextStyleVariant {\n  float minWidth = 1;\n  NodeChange fields = 2;\n  VariableData variableFontSize = 3;\n  VariableData variableLineHeight = 4;\n  VariableData variableLetterSpacing = 5;\n  VariableData variableParagraphSpacing = 6;\n  string name = 7;\n}\n\nenum FlappType {\n  POLL = 0;\n  EMBED = 1;\n  FACEPILE = 2;\n  ALIGNMENT = 3;\n  YOUTUBE = 4;\n}\n\nmessage SlideThemeProps {\n  string themeVersion = 1;\n  VariableSetID variableSetId = 2;\n  StyleId[] textStyleIds = 3;\n  bool isTextColorManuallySelected = 4;\n  bool isBorderColorManuallySelected = 5;\n  AssetRef subscribedThemeRef = 6;\n  uint schemaVersion = 7;\n  bool isGeneratedFromDesign = 8;\n}\n\nmessage SlideThemeMap {\n  SlideThemeMapEntry[] entries = 1;\n}\n\nmessage SlideThemeMapEntry {\n  ThemeID themeId = 1;\n  SlideThemeProps themeProps = 2;\n}\n\nmessage SharedSymbolReference {\n  string fileKey = 1;\n  GUID symbolID = 2;\n  string versionHash = 3;\n  GUIDPathMapping[] guidPathMappings = 4;\n  byte[] bytes = 5;\n  GUIDMapping[] libraryGUIDToSubscribingGUID = 6;\n  string componentKey = 7;\n  GUIDPathMapping[] unflatteningMappings = 8;\n  bool isUnflattened = 9;\n}\n\nmessage SharedComponentMasterData {\n  string componentKey = 1;\n  GUIDPathMapping[] publishingGUIDPathToTeamLibraryGUID = 2;\n  bool isUnflattened = 3;\n}\n\nmessage InstanceOverrideStash {\n  GUIDPath overridePathOfSwappedInstance = 1;\n  string componentKey = 2;\n  NodeChange[] overrides = 3;\n}\n\nmessage InstanceOverrideStashV2 {\n  GUIDPath overridePathOfSwappedInstance = 1;\n  GUID localSymbolID = 2;\n  NodeChange[] overrides = 3;\n}\n\nmessage ImportedCodeFileEntry {\n  CodeFileId codeFileId = 1;\n}\n\nmessage ImportedCodeFiles {\n  ImportedCodeFileEntry[] entries = 1;\n}\n\nenum BlurOpType {\n  NORMAL = 0;\n  PROGRESSIVE = 1;\n}\n\nenum RepeatType {\n  LINEAR = 0;\n  RADIAL = 1;\n}\n\nenum UnitType {\n  PIXELS = 0;\n  RELATIVE = 1;\n}\n\nenum RepeatOrder {\n  FORWARD = 0;\n  REVERSE = 1;\n}\n\nenum EffectAxis {\n  X = 0;\n  Y = 1;\n  X_AND_Y = 2;\n}\n\nmessage Effect {\n  EffectType type = 1;\n  Vector offset = 3;\n  float radius = 4;\n  bool visible = 5;\n  BlendMode blendMode = 6;\n  float spread = 7;\n  bool showShadowBehindNode = 8;\n  VariableData radiusVar = 9;\n  VariableData colorVar = 10;\n  VariableData spreadVar = 11;\n  VariableData xVar = 12;\n  VariableData yVar = 13;\n  uint count = 14;\n  RepeatType repeatType = 15;\n  EffectAxis axis = 16;\n  UnitType unitType = 17;\n  RepeatOrder order = 18;\n  BlurOpType blurOpType = 19;\n  Vector startOffset = 20;\n  Vector endOffset = 28;\n  float startRadius = 21;\n  Color color = 2;\n  Color secondaryColor = 24;\n  Vector noiseSize = 22;\n  uint seed = 29;\n  bool clipToShape = 23;\n  float density = 25;\n  NoiseType noiseType = 26;\n  float opacity = 27;\n  float refractionRadius = 30;\n  float specularAngle = 31;\n  float specularIntensity = 32;\n  float bevelSize = 33;\n  float chromaticAberration = 34;\n  float reflectionDistance = 35;\n  float refractionIntensity = 36;\n  VariableData refractionRadiusVar = 37;\n  VariableData specularAngleVar = 38;\n  VariableData specularIntensityVar = 39;\n  VariableData chromaticAberrationVar = 40;\n  VariableData splayVar = 41;\n  VariableData refractionIntensityVar = 42;\n  CodeComponentId customEffectId = 43;\n  ComponentPropAssignment[] componentPropAssignments = 44;\n  VariableData startRadiusVar = 45;\n  VariableData startOffsetXVar = 46;\n  VariableData startOffsetYVar = 47;\n  VariableData endOffsetXVar = 48;\n  VariableData endOffsetYVar = 49;\n  VariableData noiseSizeXVar = 50;\n  VariableData noiseSizeYVar = 51;\n  VariableData densityVar = 52;\n  VariableData effectOpacityVar = 53;\n  VariableData secondaryColorVar = 54;\n  GUID id = 55;\n}\n\nenum TransformModifierType {\n  REPEAT = 0;\n  SYMMETRY = 1;\n  SKEW = 2;\n}\n\nmessage TransformModifier {\n  TransformModifierType type = 1;\n  Vector offset = 2;\n  bool visible = 3;\n  uint count = 4;\n  RepeatType repeatType = 5;\n  EffectAxis axis = 6;\n  UnitType unitType = 7;\n  RepeatOrder order = 8;\n  float skewX = 9;\n  float skewY = 10;\n}\n\nenum TransformSchemaType {\n  NONE = 0;\n  FIXED_ORDER = 1;\n  FREEFORM = 2;\n}\n\nstruct Matrix4f {\n  float m00;\n  float m01;\n  float m02;\n  float m03;\n  float m10;\n  float m11;\n  float m12;\n  float m13;\n  float m20;\n  float m21;\n  float m22;\n  float m23;\n  float m30;\n  float m31;\n  float m32;\n  float m33;\n}\n\nmessage FixedOrderTransform3d {\n  float perspective = 1;\n  float translateZ = 2;\n  float rotateX = 3;\n  float rotateY = 4;\n  float rotateZ = 5;\n}\n\nenum TransformFnType {\n  NONE = 0;\n  MATRIX_3D = 1;\n  PERSPECTIVE = 2;\n  TRANSLATE_Z = 3;\n  ROTATE_X = 4;\n  ROTATE_Y = 5;\n  ROTATE_Z = 6;\n}\n\nmessage TransformFnValue {\n  Matrix4f matrix3d = 1;\n  float perspective = 2;\n  float rotateAngle = 3;\n  float translateValue = 4;\n}\n\nmessage TransformFn {\n  TransformFnType type = 1;\n  TransformFnValue value = 2;\n}\n\nmessage TransformSchemaValue {\n  FixedOrderTransform3d fixedOrderTransform3d = 1;\n  TransformFn[] transformFunctions = 2;\n}\n\nmessage Transform3d {\n  TransformSchemaType type = 1;\n  TransformSchemaValue value = 2;\n  bool backfaceHidden = 3;\n}\n\nstruct NumberVector2D {\n  Number x;\n  Number y;\n}\n\nmessage Scene3d {\n  float perspective = 1;\n  NumberVector2D perspectiveOrigin = 2;\n  bool preserve3d = 3;\n}\n\nmessage TransformOrigin {\n  Number x = 1;\n  Number y = 2;\n}\n\nmessage TransitionInfo {\n  TransitionType type = 1;\n  float duration = 2;\n}\n\nenum PrototypeDeviceType {\n  NONE = 0;\n  PRESET = 1;\n  CUSTOM = 2;\n  PRESENTATION = 3;\n}\n\nenum DeviceRotation {\n  NONE = 0;\n  CCW_90 = 1;\n}\n\nmessage PrototypeDevice {\n  PrototypeDeviceType type = 1;\n  Vector size = 2;\n  string presetIdentifier = 3;\n  DeviceRotation rotation = 4;\n}\n\nenum OverlayPositionType {\n  CENTER = 0;\n  TOP_LEFT = 1;\n  TOP_CENTER = 2;\n  TOP_RIGHT = 3;\n  BOTTOM_LEFT = 4;\n  BOTTOM_CENTER = 5;\n  BOTTOM_RIGHT = 6;\n  MANUAL = 7;\n}\n\nenum OverlayBackgroundInteraction {\n  NONE = 0;\n  CLOSE_ON_CLICK_OUTSIDE = 1;\n}\n\nenum OverlayBackgroundType {\n  NONE = 0;\n  SOLID_COLOR = 1;\n}\n\nmessage OverlayBackgroundAppearance {\n  OverlayBackgroundType backgroundType = 1;\n  Color backgroundColor = 2;\n}\n\nenum NavigationType {\n  NAVIGATE = 0;\n  OVERLAY = 1;\n  SWAP = 2;\n  SWAP_STATE = 3;\n  SCROLL_TO = 4;\n}\n\nenum ExportColorProfile {\n  DOCUMENT = 0;\n  SRGB = 1;\n  DISPLAY_P3_V4 = 2;\n  CMYK = 3;\n}\n\nenum ExportBackgroundType {\n  SOLID = 0;\n  TRANSPARENT = 1;\n  GRID = 2;\n}\n\nmessage ExportSettings {\n  string suffix = 1;\n  ImageType imageType = 2;\n  ExportConstraint constraint = 3;\n  bool svgDataName = 4;\n  ExportSVGIDMode svgIDMode = 5;\n  bool svgOutlineText = 6;\n  bool contentsOnly = 7;\n  bool svgForceStrokeMasks = 8;\n  bool useAbsoluteBounds = 9;\n  ExportColorProfile colorProfile = 10;\n  float quality = 11;\n  bool useBicubicSampler = 12;\n  int frameRate = 13;\n  int loopCount = 14;\n  ExportBackgroundType backgroundType = 15;\n}\n\nenum ExportSVGIDMode {\n  IF_NEEDED = 0;\n  ALWAYS = 1;\n}\n\nmessage LayoutGrid {\n  LayoutGridType type = 1;\n  Axis axis = 2;\n  bool visible = 3;\n  int numSections = 4;\n  float offset = 5;\n  float sectionSize = 6;\n  float gutterSize = 7;\n  Color color = 8;\n  LayoutGridPattern pattern = 9;\n  VariableData numSectionsVar = 10;\n  VariableData offsetVar = 11;\n  VariableData sectionSizeVar = 12;\n  VariableData gutterSizeVar = 13;\n}\n\nmessage Guide {\n  Axis axis = 1;\n  float offset = 2;\n  GUID guid = 3;\n}\n\nmessage Path {\n  WindingRule windingRule = 1;\n  uint commandsBlob = 2;\n  uint styleID = 3;\n}\n\nenum StyleType {\n  NONE = 0;\n  FILL = 1;\n  STROKE = 2;\n  TEXT = 3;\n  EFFECT = 4;\n  EXPORT = 5;\n  GRID = 6;\n  ANIMATION = 7;\n}\n\nenum BrushOrientation {\n  FORWARD = 0;\n  REVERSE = 1;\n}\n\nenum BrushType {\n  STRETCH = 0;\n  SCATTER = 1;\n}\n\nmessage DynamicStrokeSettings {\n  float frequency = 1;\n  float wiggle = 2;\n  float smoothen = 3;\n}\n\nmessage ScatterStrokeSettings {\n  float gap = 1;\n  float wiggle = 2;\n  float angularJitter = 3;\n  float rotation = 4;\n  float sizeJitter = 5;\n}\n\nmessage StretchStrokeSettings {\n  BrushOrientation orientation = 1;\n}\n\nmessage StrokeData {\n  Stroke[] strokes = 1;\n  uint version = 2;\n}\n\nmessage Stroke {\n  int strokeId = 1;\n  float strokeWeight = 2;\n  VariableData strokeWeightVar = 3;\n  Paint[] strokePaint = 4;\n  StyleId styleIdForStrokeFill = 5;\n  StrokeAlign strokeAlign = 6;\n  StrokeCap strokeCap = 7;\n  Number strokeCapSize = 8;\n  StrokeJoin strokeJoin = 9;\n  float miterLimit = 10;\n  float[] dashPattern = 11;\n  OptionalVector pathTrim = 12;\n  float strokeOffset = 13;\n  bool isDeleted = 14;\n}\n\nmessage VariableWidthPoint {\n  float position = 1;\n  float ascent = 2;\n  float descent = 3;\n  int segmentId = 4;\n}\n\nmessage SharedStyleReference {\n  string styleKey = 1;\n  string versionHash = 2;\n}\n\nmessage SharedStyleMasterData {\n  string styleKey = 1;\n  string sortPosition = 2;\n  string fileKey = 3;\n}\n\nenum ScrollBehavior {\n  SCROLLS = 0;\n  FIXED_WHEN_CHILD_OF_SCROLLING_FRAME = 1;\n  STICKY_SCROLLS = 2;\n}\n\nmessage ArcData {\n  float startingAngle = 1;\n  float endingAngle = 2;\n  float innerRadius = 3;\n}\n\nmessage SymbolLink {\n  string uri = 1;\n  string displayName = 2;\n  string displayText = 3;\n}\n\nmessage PluginData {\n  string pluginID = 1;\n  string value = 2;\n  string key = 3;\n}\n\nmessage PluginRelaunchData {\n  string pluginID = 1;\n  string message = 2;\n  string command = 3;\n  bool isDeleted = 4;\n  CodeComponentId customToolId = 5;\n}\n\nmessage MultiplayerFieldVersion {\n  uint counter = 1;\n  uint sessionID = 2;\n}\n\nenum ConnectorMagnet {\n  NONE = 0;\n  AUTO = 1;\n  TOP = 2;\n  LEFT = 3;\n  BOTTOM = 4;\n  RIGHT = 5;\n  CENTER = 6;\n  AUTO_HORIZONTAL = 7;\n  EDGE = 8;\n  ABSOLUTE = 9;\n}\n\nmessage ConnectorEndpoint {\n  GUID endpointNodeID = 1;\n  Vector position = 2;\n  ConnectorMagnet magnet = 3;\n  Vector relativePosition = 4;\n}\n\nmessage ConnectorControlPoint {\n  Vector position = 1;\n  Vector axis = 2;\n}\n\nenum ConnectorTextSection {\n  MIDDLE_TO_START = 0;\n  MIDDLE_TO_END = 1;\n}\n\nenum ConnectorOffAxisOffset {\n  NONE = 0;\n  ABOVE = 1;\n  BELOW = 2;\n}\n\nmessage ConnectorTextMidpoint {\n  ConnectorTextSection section = 1;\n  float offset = 2;\n  ConnectorOffAxisOffset offAxisOffset = 3;\n}\n\nenum ConnectorLineStyle {\n  ELBOWED = 0;\n  STRAIGHT = 1;\n  CURVED = 2;\n}\n\nenum ConnectorType {\n  MANUAL = 0;\n  DIAGRAM = 1;\n}\n\nenum AnnotationPropertyType {\n  FILL = 0;\n  STROKE = 1;\n  WIDTH = 2;\n  HEIGHT = 3;\n  MIN_WIDTH = 4;\n  MIN_HEIGHT = 5;\n  MAX_WIDTH = 6;\n  MAX_HEIGHT = 7;\n  STROKE_WIDTH = 8;\n  CORNER_RADIUS = 9;\n  EFFECT = 10;\n  TEXT_STYLE = 11;\n  TEXT_ALIGN_HORIZONTAL = 12;\n  FONT_FAMILY = 13;\n  FONT_SIZE = 14;\n  FONT_WEIGHT = 15;\n  LINE_HEIGHT = 16;\n  LETTER_SPACING = 17;\n  STACK_SPACING = 18;\n  STACK_PADDING = 19;\n  STACK_MODE = 20;\n  STACK_ALIGNMENT = 21;\n  OPACITY = 22;\n  COMPONENT = 23;\n  FONT_STYLE = 24;\n  GRID_ROW_GAP = 25;\n  GRID_COLUMN_GAP = 26;\n  GRID_ROW_COUNT = 27;\n  GRID_COLUMN_COUNT = 28;\n  GRID_ROW_ANCHOR_INDEX = 29;\n  GRID_COLUMN_ANCHOR_INDEX = 30;\n  GRID_ROW_SPAN = 31;\n  GRID_COLUMN_SPAN = 32;\n}\n\nmessage AnnotationProperty {\n  AnnotationPropertyType type = 1;\n}\n\nenum AnnotationCategoryPreset {\n  NONE = 0;\n  ACCESSIBILITY = 1;\n  BEHAVIOR = 2;\n  CONTENT = 3;\n  DEVELOPMENT = 4;\n  INTERACTION = 5;\n}\n\nenum AnnotationCategoryColor {\n  YELLOW = 0;\n  ORANGE = 1;\n  RED = 2;\n  PINK = 3;\n  VIOLET = 4;\n  BLUE = 5;\n  TEAL = 6;\n  GREEN = 7;\n}\n\nmessage AnnotationCategoryCustom {\n  AnnotationCategoryColor color = 1;\n  Color customColor = 2;\n  string label = 3;\n}\n\nmessage AnnotationCategory {\n  GUID id = 1;\n  AnnotationCategoryPreset preset = 2;\n  AnnotationCategoryCustom custom = 3;\n}\n\nmessage AnnotationCategories {\n  uint version = 1;\n  AnnotationCategory[] items = 2;\n}\n\nmessage Annotation {\n  string label = 1;\n  AnnotationProperty[] properties = 2;\n  string labelV2 = 3;\n  GUID categoryId = 4;\n}\n\nenum AnnotationMeasurementNodeSide {\n  TOP = 0;\n  BOTTOM = 1;\n  LEFT = 2;\n  RIGHT = 3;\n}\n\nmessage AnnotationMeasurement {\n  GUID id = 1;\n  GUID fromNode = 2;\n  GUID toNode = 3;\n  AnnotationMeasurementNodeSide fromNodeSide = 4;\n  bool toSameSide = 5;\n  float innerOffsetRelative = 6;\n  float outerOffsetFixed = 7;\n  GUIDPath toNodeStablePath = 8;\n  string freeText = 9;\n}\n\nmessage LibraryMoveInfo {\n  string oldKey = 1;\n  string pasteFileKey = 2;\n}\n\nmessage LibraryMoveHistoryItem {\n  GUID sourceNodeId = 1;\n  string sourceComponentKey = 2;\n}\n\nmessage DeveloperRelatedLink {\n  string nodeId = 1;\n  string fileKey = 2;\n  string linkName = 3;\n  string linkUrl = 4;\n}\n\nmessage WidgetPointer {\n  GUID nodeId = 1;\n}\n\nmessage EditInfo {\n  string timestampIso8601 = 1;\n  string userId = 2;\n  uint lastEditedAt = 3;\n  uint createdAt = 4;\n}\n\nenum EditorType {\n  DESIGN = 0;\n  WHITEBOARD = 1;\n  SLIDES = 2;\n  DEV_HANDOFF = 3;\n  SITES = 4;\n  COOPER = 5;\n  ILLUSTRATION = 6;\n  FIGMAKE = 7;\n  FIGSPEC = 8;\n}\n\nenum MaskType {\n  ALPHA = 0;\n  OUTLINE = 1;\n  LUMINANCE = 2;\n}\n\nenum ModuleType {\n  NONE = 0;\n  SINGLE_NODE = 1;\n  MULTI_NODE = 2;\n}\n\nenum SectionStatus {\n  NONE = 0;\n  BUILD = 1;\n  COMPLETED = 2;\n}\n\nmessage SectionStatusInfo {\n  SectionStatus status = 1;\n  uint lastUpdateUnixTimestamp = 2;\n  string description = 3;\n  string userId = 4;\n  SectionStatus prevStatus = 5;\n}\n\nmessage BuzzApprovalRequestInfo {\n  string requestId = 1;\n  string requesterUserId = 2;\n  uint requestedAt = 3;\n  string[] reviewerUserIds = 4;\n  string title = 5;\n  string note = 6;\n  GUID[] assetsInRequest = 7;\n}\n\nmessage BuzzApprovalRequests {\n  BuzzApprovalRequestInfo[] requests = 1;\n}\n\nenum BuzzApprovalNodeStatus {\n  NONE = 0;\n  IN_REVIEW = 1;\n  APPROVED = 2;\n  CHANGES_REQUESTED = 3;\n}\n\nmessage BuzzApprovalNodeStatusInfo {\n  BuzzApprovalNodeStatus currentStatus = 1;\n  bool wasPreviouslyApproved = 2;\n  uint[] approvalRevokedAtHistory = 3;\n}\n\nmessage CodeEmbedInfo {\n  string url = 1;\n  string srcUrl = 2;\n  string title = 3;\n  string thumbnailImageHash = 4;\n  bool isPublishedSite = 5;\n}\n\nenum VariableTimingDisplayUnit {\n  MILLISECONDS = 0;\n  SECONDS = 1;\n}\n\nmessage NodeChange {\n  GUID guid = 1;\n  uint guidTag = 53;\n  NodePhase phase = 2;\n  uint phaseTag = 54;\n  ParentIndex parentIndex = 3;\n  uint parentIndexTag = 55;\n  NodeType type = 4;\n  uint typeTag = 56;\n  string name = 5;\n  uint nameTag = 57;\n  bool isPublishable = 174;\n  string description = 318;\n  LibraryMoveInfo libraryMoveInfo = 256;\n  LibraryMoveHistoryItem[] libraryMoveHistory = 281;\n  string key = 319;\n  AssetIdMap fileAssetIds = 383;\n  uint styleID = 49;\n  uint styleIDTag = 101;\n  bool isFillStyle = 157;\n  bool isStrokeStyle = 161;\n  bool isOverrideOverTextStyle = 376;\n  StyleType styleType = 163;\n  string styleDescription = 191;\n  string version = 171;\n  string userFacingVersion = 399;\n  string sortPosition = 320;\n  SharedStyleMasterData ojansSuperSecretNodeField = 345;\n  SharedStyleMasterData sevMoonlitLilyData = 348;\n  bool isSoftDeletedStyle = 176;\n  bool isNonUpdateable = 177;\n  SharedStyleMasterData sharedStyleMasterData = 172;\n  SharedStyleReference sharedStyleReference = 173;\n  GUID inheritFillStyleID = 158;\n  GUID inheritStrokeStyleID = 162;\n  GUID inheritTextStyleID = 167;\n  GUID inheritExportStyleID = 168;\n  GUID inheritEffectStyleID = 169;\n  GUID inheritGridStyleID = 170;\n  GUID inheritFillStyleIDForStroke = 185;\n  StyleId styleIdForFill = 332;\n  StyleId styleIdForStrokeFill = 333;\n  StyleId styleIdForText = 334;\n  StyleId styleIdForEffect = 335;\n  StyleId styleIdForGrid = 336;\n  StyleAnimation[] styleAnimations = 580;\n  Paint[] backgroundPaints = 193;\n  GUID inheritFillStyleIDForBackground = 194;\n  bool isStateGroup = 225;\n  StateGroupPropertyValueOrder[] stateGroupPropertyValueOrders = 238;\n  PartialPasteAnnotation partialPasteAnnotation = 581;\n  SharedSymbolReference sharedSymbolReference = 122;\n  bool isSymbolPublishable = 123;\n  GUIDPathMapping[] sharedSymbolMappings = 124;\n  string sharedSymbolVersion = 126;\n  SharedComponentMasterData sharedComponentMasterData = 152;\n  string symbolDescription = 144;\n  GUIDPathMapping[] unflatteningMappings = 164;\n  GUIDPathMapping[] forceUnflatteningMappings = 228;\n  string publishFile = 214;\n  string sourceLibraryKey = 395;\n  GUID publishID = 215;\n  string componentKey = 216;\n  bool isC2 = 217;\n  string publishedVersion = 218;\n  string originComponentKey = 252;\n  ComponentPropDef[] componentPropDefs = 266;\n  ComponentPropRef[] componentPropRefs = 267;\n  VariantPropSpec[] variantPropSpecs = 483;\n  SymbolData symbolData = 113;\n  uint symbolDataTag = 114;\n  NodeChange[] derivedSymbolData = 125;\n  bool nestedInstanceResizeEnabled = 394;\n  GUID overriddenSymbolID = 143;\n  ComponentPropAssignment[] componentPropAssignments = 268;\n  bool propsAreBubbled = 305;\n  InstanceOverrideStash[] overrideStash = 248;\n  InstanceOverrideStashV2[] overrideStashV2 = 250;\n  GUIDPath guidPath = 111;\n  uint guidPathTag = 112;\n  int overrideLevel = 321;\n  ModuleType moduleType = 382;\n  bool isSlot = 463;\n  bool isSlotContent = 495;\n  float fontSize = 21;\n  uint fontSizeTag = 73;\n  float paragraphIndent = 22;\n  uint paragraphIndentTag = 74;\n  float paragraphSpacing = 23;\n  uint paragraphSpacingTag = 75;\n  TextAlignHorizontal textAlignHorizontal = 32;\n  uint textAlignHorizontalTag = 84;\n  TextAlignVertical textAlignVertical = 33;\n  uint textAlignVerticalTag = 85;\n  TextCase textCase = 34;\n  uint textCaseTag = 86;\n  TextDecoration textDecoration = 35;\n  uint textDecorationTag = 87;\n  Number lineHeight = 40;\n  uint lineHeightTag = 92;\n  FontName fontName = 41;\n  uint fontNameTag = 93;\n  TextData textData = 42;\n  uint textDataTag = 94;\n  DerivedTextData derivedTextData = 359;\n  bool fontVariantCommonLigatures = 127;\n  bool fontVariantContextualLigatures = 128;\n  bool fontVariantDiscretionaryLigatures = 129;\n  bool fontVariantHistoricalLigatures = 130;\n  bool fontVariantOrdinal = 131;\n  bool fontVariantSlashedZero = 132;\n  FontVariantNumericFigure fontVariantNumericFigure = 133;\n  FontVariantNumericSpacing fontVariantNumericSpacing = 134;\n  FontVariantNumericFraction fontVariantNumericFraction = 135;\n  FontVariantCaps fontVariantCaps = 136;\n  FontVariantPosition fontVariantPosition = 137;\n  Number letterSpacing = 165;\n  string fontVersion = 202;\n  LeadingTrim leadingTrim = 322;\n  bool hangingPunctuation = 337;\n  bool hangingList = 339;\n  bool fallbackGlyphs = 550;\n  int maxLines = 351;\n  ResponsiveTextStyleVariant[] responsiveTextStyleVariants = 417;\n  SectionStatus sectionStatus = 352;\n  SectionStatusInfo sectionStatusInfo = 355;\n  uint textUserLayoutVersion = 203;\n  uint textExplicitLayoutVersion = 396;\n  OpenTypeFeature[] toggledOnOTFeatures = 205;\n  OpenTypeFeature[] toggledOffOTFeatures = 206;\n  Hyperlink hyperlink = 223;\n  Mention mention = 340;\n  FontVariation[] fontVariations = 260;\n  uint textBidiVersion = 279;\n  TextTruncation textTruncation = 280;\n  bool hasHadRTLText = 292;\n  EmojiImageSet emojiImageSet = 391;\n  string slideThumbnailHash = 392;\n  bool visible = 6;\n  uint visibleTag = 58;\n  bool locked = 7;\n  uint lockedTag = 59;\n  LockMode lockMode = 434;\n  float opacity = 8;\n  uint opacityTag = 60;\n  BlendMode blendMode = 9;\n  uint blendModeTag = 61;\n  Vector size = 11;\n  uint sizeTag = 63;\n  Matrix transform = 12;\n  uint transformTag = 64;\n  float[] dashPattern = 13;\n  uint dashPatternTag = 65;\n  bool mask = 16;\n  uint maskTag = 68;\n  Vector rotationOrigin = 424;\n  bool maskIsOutline = 18;\n  uint maskIsOutlineTag = 70;\n  MaskType maskType = 317;\n  float backgroundOpacity = 19;\n  uint backgroundOpacityTag = 71;\n  float cornerRadius = 20;\n  uint cornerRadiusTag = 72;\n  float strokeWeight = 26;\n  uint strokeWeightTag = 78;\n  StrokeAlign strokeAlign = 29;\n  uint strokeAlignTag = 81;\n  StrokeCap strokeCap = 30;\n  uint strokeCapTag = 82;\n  Number strokeCapSize = 497;\n  StrokeJoin strokeJoin = 31;\n  uint strokeJoinTag = 83;\n  Paint[] fillPaints = 38;\n  uint fillPaintsTag = 90;\n  Paint[] strokePaints = 39;\n  uint strokePaintsTag = 91;\n  Effect[] effects = 43;\n  uint effectsTag = 95;\n  Color backgroundColor = 50;\n  uint backgroundColorTag = 102;\n  Path[] fillGeometry = 51;\n  uint fillGeometryTag = 103;\n  Path[] strokeGeometry = 52;\n  uint strokeGeometryTag = 104;\n  Path[] offsetFillMaskGeometry = 564;\n  Paint[] textDecorationFillPaints = 411;\n  bool textDecorationSkipInk = 412;\n  Number textUnderlineOffset = 413;\n  Number textDecorationThickness = 415;\n  TextDecorationStyle textDecorationStyle = 416;\n  TransformModifier[] transformModifiers = 455;\n  Transform3d transform3d = 570;\n  StrokeData strokeData = 571;\n  Scene3d scene3d = 572;\n  TransformOrigin transformOrigin = 587;\n  float rectangleTopLeftCornerRadius = 145;\n  float rectangleTopRightCornerRadius = 146;\n  float rectangleBottomLeftCornerRadius = 147;\n  float rectangleBottomRightCornerRadius = 148;\n  bool rectangleCornerRadiiIndependent = 149;\n  bool rectangleCornerToolIndependent = 150;\n  bool proportionsConstrained = 151;\n  OptionalVector targetAspectRatio = 423;\n  bool useAbsoluteBounds = 258;\n  bool borderTopHidden = 287;\n  bool borderBottomHidden = 288;\n  bool borderLeftHidden = 289;\n  bool borderRightHidden = 290;\n  bool bordersTakeSpace = 294;\n  float borderTopWeight = 295;\n  float borderBottomWeight = 296;\n  float borderLeftWeight = 297;\n  float borderRightWeight = 298;\n  bool borderStrokeWeightsIndependent = 299;\n  ConstraintType horizontalConstraint = 28;\n  uint horizontalConstraintTag = 80;\n  StackMode stackMode = 105;\n  uint stackModeTag = 106;\n  float stackSpacing = 107;\n  uint stackSpacingTag = 108;\n  float stackPadding = 109;\n  uint stackPaddingTag = 110;\n  StackCounterAlign stackCounterAlign = 120;\n  StackJustify stackJustify = 121;\n  StackAlign stackAlign = 208;\n  float stackHorizontalPadding = 209;\n  float stackVerticalPadding = 210;\n  StackSize stackWidth = 211;\n  StackSize stackHeight = 212;\n  StackSize stackPrimarySizing = 229;\n  StackJustify stackPrimaryAlignItems = 230;\n  StackAlign stackCounterAlignItems = 231;\n  float stackChildPrimaryGrow = 232;\n  float stackPaddingRight = 233;\n  float stackPaddingBottom = 234;\n  StackCounterAlign stackChildAlignSelf = 236;\n  StackPositioning stackPositioning = 269;\n  bool stackReverseZIndex = 271;\n  StackWrap stackWrap = 323;\n  float stackCounterSpacing = 324;\n  OptionalVector minSize = 325;\n  OptionalVector maxSize = 326;\n  StackCounterAlignContent stackCounterAlignContent = 343;\n  int[] sortedMovingChildIndices = 406;\n  uint stackLayoutVersion = 574;\n  GUIDPositionMap gridRows = 435;\n  GUIDPositionMap gridColumns = 436;\n  float gridRowGap = 437;\n  float gridColumnGap = 438;\n  GUID gridRowAnchor = 439;\n  GUID gridColumnAnchor = 440;\n  uint gridRowSpan = 441;\n  uint gridColumnSpan = 442;\n  GUIDGridTrackSizeMap gridColumnsSizing = 474;\n  GUIDGridTrackSizeMap gridRowsSizing = 475;\n  GridChildAlign gridChildVerticalAlign = 476;\n  GridChildAlign gridChildHorizontalAlign = 477;\n  GridAutoTracks gridAutoTracks = 555;\n  bool gridReflowEnabled = 556;\n  bool isSnakeGameBoard = 344;\n  GUID transitionNodeID = 139;\n  GUID prototypeStartNodeID = 140;\n  Color prototypeBackgroundColor = 141;\n  TransitionInfo transitionInfo = 153;\n  TransitionType transitionType = 154;\n  float transitionDuration = 155;\n  EasingType easingType = 156;\n  bool transitionPreserveScroll = 181;\n  ConnectionType connectionType = 182;\n  string connectionURL = 183;\n  PrototypeDevice prototypeDevice = 184;\n  InteractionType interactionType = 187;\n  float transitionTimeout = 188;\n  bool interactionMaintained = 189;\n  float interactionDuration = 190;\n  bool destinationIsOverlay = 192;\n  bool transitionShouldSmartAnimate = 207;\n  PrototypeInteraction[] prototypeInteractions = 226;\n  PrototypeInteraction[] objectAnimations = 426;\n  PrototypeStartingPoint prototypeStartingPoint = 249;\n  PluginData[] pluginData = 204;\n  PluginRelaunchData[] pluginRelaunchData = 219;\n  ConnectorEndpoint connectorStart = 242;\n  ConnectorEndpoint connectorEnd = 243;\n  ConnectorLineStyle connectorLineStyle = 244;\n  StrokeCap connectorStartCap = 245;\n  StrokeCap connectorEndCap = 246;\n  ConnectorControlPoint[] connectorControlPoints = 253;\n  ConnectorControlPoint[] connectorBezierControlPoints = 479;\n  ConnectorTextMidpoint connectorTextMidpoint = 255;\n  ConnectorType connectorType = 373;\n  int connectorVersion = 533;\n  Annotation[] annotations = 369;\n  AnnotationMeasurement[] measurements = 384;\n  AnnotationCategories annotationCategories = 453;\n  ShapeWithTextType shapeWithTextType = 241;\n  float shapeUserHeight = 247;\n  bool isStrokePaintDerived = 530;\n  DerivedImmutableFrameData derivedImmutableFrameData = 254;\n  MultiplayerFieldVersion derivedImmutableFrameDataVersion = 338;\n  NodeGenerationData nodeGenerationData = 240;\n  JsxData jsxData = 491;\n  DerivedJsxData derivedJsxData = 492;\n  string stableKey = 493;\n  CodeBlockLanguage codeBlockLanguage = 259;\n  CodeBlockTheme codeBlockTheme = 433;\n  LinkPreviewData linkPreviewData = 278;\n  bool shapeTruncates = 282;\n  bool sectionContentsHidden = 283;\n  VideoPlayback videoPlayback = 300;\n  StampData stampData = 301;\n  SectionPresetInfo sectionPresetInfo = 370;\n  PlatformShapeDefinition platformShapeDefinition = 409;\n  MultiplayerMap widgetSyncedState = 273;\n  uint widgetSyncCursor = 274;\n  WidgetDerivedSubtreeCursor widgetDerivedSubtreeCursor = 275;\n  WidgetPointer widgetCachedAncestor = 276;\n  WidgetInputBehavior widgetInputBehavior = 285;\n  string widgetTooltip = 286;\n  WidgetHoverStyle widgetHoverStyle = 291;\n  bool isWidgetStickable = 293;\n  bool shouldHideCursorsOnWidgetHover = 360;\n  WidgetMetadata widgetMetadata = 262;\n  WidgetEvent[] widgetEvents = 263;\n  WidgetPropertyMenuItem[] widgetPropertyMenuItems = 265;\n  WidgetInputTextNodeType widgetInputTextNodeType = 401;\n  MultiplayerMap jsxProps = 489;\n  TableRowColumnPositionMap tableRowPositions = 308;\n  TableRowColumnPositionMap tableColumnPositions = 309;\n  TableRowColumnSizeMap tableRowHeights = 310;\n  TableRowColumnSizeMap tableColumnWidths = 311;\n  TableMergedCellMap tableMergedCells = 538;\n  MultiplayerMap interactiveSlideConfigData = 371;\n  MultiplayerMap interactiveSlideParticipantData = 372;\n  FlappType flappType = 402;\n  bool isEmbeddedPrototype = 486;\n  string slideSpeakerNotes = 389;\n  bool isSkippedSlide = 410;\n  MultiplayerMap presentationOutlines = 573;\n  ThemeID themeID = 379;\n  SlideThemeData slideThemeData = 381;\n  SlideThemeMap slideThemeMap = 390;\n  string slideTemplateFileKey = 393;\n  SlideNumber slideNumber = 443;\n  string slideNumberSeparator = 456;\n  GUID diagramParentId = 363;\n  GUID layoutRoot = 362;\n  string layoutPosition = 364;\n  DiagramLayoutRuleType diagramLayoutRuleType = 366;\n  DiagramParentIndex diagramParentIndex = 367;\n  DiagramLayoutPaused diagramLayoutPaused = 368;\n  bool isPageDivider = 380;\n  InternalEnumForTest internalEnumForTest = 251;\n  InternalDataForTest internalDataForTest = 257;\n  bool autoRename = 14;\n  uint autoRenameTag = 66;\n  bool backgroundEnabled = 15;\n  uint backgroundEnabledTag = 67;\n  bool exportContentsOnly = 17;\n  uint exportContentsOnlyTag = 69;\n  float miterLimit = 25;\n  uint miterLimitTag = 77;\n  float textTracking = 27;\n  uint textTrackingTag = 79;\n  ConstraintType verticalConstraint = 37;\n  uint verticalConstraintTag = 89;\n  ExportSettings[] exportSettings = 45;\n  uint exportSettingsTag = 97;\n  TextAutoResize textAutoResize = 46;\n  uint textAutoResizeTag = 98;\n  LayoutGrid[] layoutGrids = 47;\n  uint layoutGridsTag = 99;\n  bool frameMaskDisabled = 115;\n  uint frameMaskDisabledTag = 116;\n  bool resizeToFit = 117;\n  uint resizeToFitTag = 118;\n  BooleanOperation booleanOperation = 36;\n  uint booleanOperationTag = 88;\n  VectorMirror handleMirroring = 44;\n  uint handleMirroringTag = 96;\n  uint count = 10;\n  uint countTag = 62;\n  float starInnerScale = 24;\n  uint starInnerScaleTag = 76;\n  ArcData arcData = 195;\n  VectorData vectorData = 48;\n  uint vectorDataTag = 100;\n  uint vectorOperationVersion = 425;\n  TextPathStart textPathStart = 432;\n  bool exportBackgroundDisabled = 119;\n  Guide[] guides = 138;\n  bool internalOnly = 142;\n  ScrollDirection scrollDirection = 159;\n  float cornerSmoothing = 160;\n  Vector scrollOffset = 166;\n  bool exportTextAsSVGText = 175;\n  ScrollContractedState scrollContractedState = 178;\n  Vector contractedSize = 179;\n  string fixedChildrenDivider = 180;\n  ScrollBehavior scrollBehavior = 186;\n  int derivedSymbolDataLayoutVersion = 196;\n  NavigationType navigationType = 197;\n  OverlayPositionType overlayPositionType = 198;\n  Vector overlayRelativePosition = 199;\n  OverlayBackgroundInteraction overlayBackgroundInteraction = 200;\n  OverlayBackgroundAppearance overlayBackgroundAppearance = 201;\n  GUID overrideKey = 213;\n  bool containerSupportsFillStrokeAndCorners = 220;\n  StackSize stackCounterSizing = 221;\n  bool containersSupportFillStrokeAndCorners = 222;\n  KeyTrigger keyTrigger = 224;\n  string voiceEventPhrase = 227;\n  GUID[] ancestorPathBeforeDeletion = 235;\n  SymbolLink[] symbolLinks = 237;\n  TextListData textListData = 239;\n  bool detachOpticalSizeFromFontSize = 261;\n  float listSpacing = 264;\n  EmbedData embedData = 270;\n  RichMediaData richMediaData = 272;\n  MultiplayerMap renderedSyncedState = 277;\n  bool simplifyInstancePanels = 284;\n  HTMLTag accessibleHTMLTag = 302;\n  ARIARole ariaRole = 303;\n  ARIAAttributesMap ariaAttributes = 357;\n  string accessibleLabel = 304;\n  bool isDecorativeImage = 490;\n  VariableData variableData = 306;\n  VariableDataMap variableConsumptionMap = 307;\n  VariableModeBySetMap variableModeBySetMap = 316;\n  VariableSetMode[] variableSetModes = 312;\n  VariableSetID variableSetID = 313;\n  VariableResolvedDataType variableResolvedType = 314;\n  VariableDataValues variableDataValues = 315;\n  string variableTokenName = 350;\n  VariableTimingDisplayUnit timingDisplayUnit = 566;\n  VariableScope[] variableScopes = 353;\n  VariableDataMap parameterConsumptionMap = 445;\n  CodeSyntaxMap codeSyntax = 358;\n  PasteSource pasteSource = 388;\n  EditorType pageType = 397;\n  GUID strokeBrushGuid = 446;\n  uint64 strokeSeed = 482;\n  VariableWidthPoint[] variableWidthPoints = 447;\n  DynamicStrokeSettings dynamicStrokeSettings = 448;\n  ScatterStrokeSettings scatterStrokeSettings = 449;\n  StretchStrokeSettings stretchStrokeSettings = 450;\n  Matrix[] scatterBrushTransforms = 488;\n  BrushType brushType = 452;\n  OptionalVector pathTrim = 542;\n  float strokeOffset = 554;\n  VariableSetID backingVariableSetId = 377;\n  VariableID overriddenVariableId = 464;\n  VariableIdOrVariableOverrideId backingVariableId = 378;\n  bool isCollectionExtendable = 385;\n  string rootVariableKey = 386;\n  InheritedVariablesData inheritedVariableIds = 517;\n  HandoffStatusMap handoffStatusMap = 361;\n  AgendaPositionMap agendaPositionMap = 327;\n  AgendaMetadataMap agendaMetadataMap = 328;\n  MigrationStatus migrationStatus = 329;\n  bool isSoftDeleted = 330;\n  EditInfo editInfo = 331;\n  ColorProfile colorProfile = 341;\n  SymbolId detachedSymbolId = 342;\n  ChildReadingDirection childReadingDirection = 346;\n  string readingIndex = 347;\n  DocumentColorProfile documentColorProfile = 349;\n  DeveloperRelatedLink[] developerRelatedLinks = 354;\n  string slideActiveThemeLibKey = 356;\n  EditScopeInfo editScopeInfo = 365;\n  SemanticWeight semanticWeight = 374;\n  SemanticItalic semanticItalic = 375;\n  bool areSlidesManuallyIndented = 403;\n  bool isResponsiveSet = 387;\n  DerivedBreakpointData derivedBreakpointData = 500;\n  GUID defaultResponsiveSetId = 398;\n  bool isPrimaryBreakpoint = 458;\n  GUID primaryResponsiveNodeId = 457;\n  GUID multiEditGlueId = 462;\n  float breakpointMinWidth = 501;\n  bool isBreakpointInFocus = 522;\n  ResponsiveSetSettings responsiveSetSettings = 400;\n  NodeBehaviors behaviors = 404;\n  string sourceCode = 414;\n  CollaborativeTextOpID[] sourceCodeCollaborativeTextVersion = 534;\n  CollaborativePlainText collaborativeSourceCode = 444;\n  CodeLibraryId belongsToCodeLibraryId = 427;\n  ImportedCodeFiles importedCodeFiles = 467;\n  CanvasNodeId codeFileCanvasNodeId = 468;\n  bool isEntrypointCodeFile = 498;\n  string componentOrStateGroupKey = 502;\n  uint componentOrStateGroupVersion = 503;\n  string sourceCodeLibraryKey = 504;\n  string[] sourceCodeLibraryKeys = 515;\n  UsedMakeLibrary[] usedMakeLibraries = 524;\n  string makeLibraryComponentId = 518;\n  bool shouldHidePreviewForMakeKitCreation = 520;\n  bool isMakeKit = 551;\n  PrototypeDevice codePreviewSettings = 531;\n  CodeExample[] codeExamples = 525;\n  CodeFileId exportedFromCodeFileId = 428;\n  string codeExportName = 430;\n  string codeComponentDescription = 547;\n  CodeComponentId backingCodeComponentId = 429;\n  bool isMainCodeComponent = 487;\n  CodeSnapshotState codeSnapshotState = 431;\n  NodeChatMessage[] chatMessages = 451;\n  NodeChatCompressionState chatCompressionState = 485;\n  AIChatThread aiChatThread = 496;\n  string codeChatMessagesKey = 484;\n  CodeSnapshot codeSnapshot = 459;\n  CodeSnapshotLayers codeSnapshotLayers = 589;\n  uint codeSnapshotInvalidatedAt = 480;\n  bool isCodeBehavior = 465;\n  bool autoForkCode = 469;\n  bool hasBeenManuallyRenamed = 470;\n  bool codeCreatedFromDesign = 471;\n  CanvasNodeId codeCreatedFromDesignNodeId = 481;\n  ImageImportMap imageImports = 473;\n  CodeObjectType codeObjectType = 516;\n  string codeFilePath = 472;\n  CodeBehaviorData codeBehaviorData = 478;\n  uint codeLibraryFormat = 519;\n  bool isCodePreviewPlayingOnCanvas = 527;\n  CodeEmbedInfo codeEmbedInfo = 532;\n  bool isEmbedCodeLayer = 546;\n  CodeSourceInfo codeSourceInfo = 558;\n  string mimeType = 536;\n  byte[] blobRef = 537;\n  CMSSelector cmsSelector = 419;\n  CMSConsumptionMap cmsConsumptionMap = 420;\n  CMSRichTextStyleMap cmsRichTextStyleMap = 460;\n  SymbolId repeaterSymbolId = 539;\n  RepeaterCmsOverrideData repeaterCmsOverrideData = 540;\n  RepeaterSymbolOverrideData repeaterSymbolOverrideData = 549;\n  RepeaterOverrideData repeaterOverrideData = 541;\n  uint[] aiEditedNodeChangeFieldNumbers = 405;\n  string aiEditScopeLabel = 408;\n  FirstDraftData firstDraftData = 407;\n  FirstDraftKitElementData firstDraftKitElementData = 418;\n  CooperRevertData cooperRevertData = 421;\n  CooperTemplateData cooperTemplateData = 461;\n  BuzzApprovalRequests buzzApprovalRequests = 528;\n  BuzzApprovalNodeStatusInfo buzzApprovalNodeStatusInfo = 529;\n  HubFileAttribution hubFileAttribution = 422;\n  ManagedStringData managedStringData = 454;\n  ThumbnailInfo thumbnailInfo = 466;\n  AiCanvasPrompt aiCanvasPrompt = 494;\n  CanvasNodeId backingNodeId = 499;\n  string pageStatus = 548;\n  TRSSTransform2D motionTransform = 523;\n  int64 timelinePosition = 506;\n  KeyframeValueData keyframeValue = 507;\n  VariableData keyframeValueRef = 586;\n  InterpolationType interpolationType = 505;\n  BezierHandles bezierHandles = 508;\n  EasingData easingData = 535;\n  KeyframeOperation keyframeOperation = 509;\n  TimelinePositionType timelinePositionType = 510;\n  bool isClip = 545;\n  GUID clipId = 511;\n  uint64 timelineDuration = 512;\n  int64 timelineOffset = 513;\n  bool timelineDisabled = 543;\n  PlaybackStyle playbackStyle = 514;\n  TimelineDefinitionsMap timelineDefinitions = 552;\n  TimelineAssignmentsMap timelineAssignments = 553;\n  AnimationPresets animationPresets = 521;\n  StyleIdForAnimation[] styleIdsForAnimation = 582;\n  AnimationPresetId backingAnimationPresetId = 583;\n  Tools tools = 568;\n  CustomEffects customEffects = 569;\n  TransitionOverrideData transitionOverrides = 526;\n  bool useLegacySmartAnimate = 544;\n  SourceControlConfig sourceControlConfig = 557;\n  SpecBlockType specBlockType = 559;\n  CollaborativePlainText specBlockContent = 560;\n  string specCodeBlockLanguage = 561;\n  string specBlockTableAlignment = 562;\n  int specBlockIndentLevel = 563;\n  string specImageHash = 575;\n  int specWidth = 576;\n  int specHeight = 577;\n  TableRowColumnSizeMap specBlockTableRowHeights = 578;\n  TableRowColumnSizeMap specBlockTableColumnWidths = 579;\n  string specEmbedUrl = 590;\n  bool placeholder = 565;\n  string placeholderClientLifecycleId = 584;\n  int placeholderInvalidateAt = 585;\n  bool disableJitDst = 567;\n  CustomToolArtifactRef customToolArtifactRef = 588;\n}\n\nenum GitRepoRefProvider {\n  UGIT = 0;\n  GITHUB = 1;\n  OTHER = 2;\n}\n\nmessage GitRepoRef {\n  GitRepoRefProvider provider = 1;\n  string gitRepo = 2;\n  string gitRef = 3;\n}\n\nmessage SourceControlConfig {\n  GitRepoRef origin = 1;\n  GitRepoRef upstream = 2;\n}\n\nmessage CodeSnapshot {\n  CodeSnapshotState state = 6;\n  uint invalidatedAt = 7;\n  Paint[] paints = 1;\n  Vector offset = 2;\n  Vector layoutSize = 3;\n  Vector canvasSize = 5;\n  uint devicePixelRatio = 4;\n}\n\nmessage CodeOutputLayer {\n  NodeChange node = 1;\n}\n\nmessage CodeSnapshotLayers {\n  CodeSnapshotState state = 1;\n  uint invalidatedAt = 2;\n  CodeOutputLayer[] layers = 3;\n}\n\nmessage CodeBehaviorData {\n  string name = 1;\n  string icon = 2;\n  string[] nodeTypes = 3;\n  string category = 4;\n  uint apiVersion = 5;\n}\n\nmessage CodeExample {\n  string exampleName = 1;\n  string codeExportName = 2;\n}\n\nmessage UsedMakeLibrary {\n  string makeLibraryId = 1;\n}\n\nmessage CookieBannerText {\n  string bannerHeader = 1;\n  string bannerDisclaimerExplicit = 2;\n  string bannerDisclaimerImplicit = 3;\n  string policyLabel = 4;\n  string acceptText = 5;\n  string acknowledgeText = 6;\n  string manageText = 7;\n  string rejectText = 8;\n  string necessaryText = 9;\n  string necessaryDescription = 10;\n  string analyticsText = 11;\n  string analyticsDescription = 12;\n  string preferencesText = 13;\n  string preferencesDescription = 14;\n  string marketingText = 15;\n  string marketingDescription = 16;\n  string saveLabel = 17;\n  string triggerLabel = 18;\n}\n\nmessage CookieBannerSettings {\n  bool enabled = 1;\n  CookieBannerComponentType componentType = 2;\n  CookieXAlignment xAlignment = 3;\n  CookieYAlignment yAlignment = 4;\n  CookieXAlignment triggerXAlignment = 5;\n  CookieYAlignment triggerYAlignment = 6;\n  TriggerComponentType triggerComponentType = 7;\n  string policyUrl = 8;\n  CookieBannerText text = 9;\n  GUID policyLink = 10;\n  string locale = 11;\n}\n\nenum CookieBannerComponentType {\n  BANNER = 0;\n  MODAL = 1;\n}\n\nenum TriggerComponentType {\n  BANNER = 0;\n  TAG = 1;\n}\n\nenum CookieXAlignment {\n  LEFT = 0;\n  CENTER = 1;\n  RIGHT = 2;\n}\n\nenum CookieYAlignment {\n  TOP = 0;\n  CENTER = 1;\n  BOTTOM = 2;\n}\n\nmessage ResponsiveSetSettings {\n  string title = 1;\n  string description = 2;\n  ResponsiveScalingMode scalingMode = 3;\n  float scalingMinFontSize = 4;\n  float scalingMaxFontSize = 5;\n  float scalingMinLayoutWidth = 6;\n  float scalingMaxLayoutWidth = 7;\n  string lang = 8;\n  string faviconHash = 9;\n  string socialImageHash = 10;\n  string googleAnalyticsID = 11;\n  bool blockSearchIndexing = 12;\n  string customCodeHeadStart = 13;\n  string customCodeHeadEnd = 14;\n  string customCodeBodyStart = 15;\n  string customCodeBodyEnd = 16;\n  GUID faviconID = 17;\n  GUID socialImageID = 18;\n  bool addBypassLinks = 19;\n  bool ignoreReducedMotion = 20;\n  CookieBannerSettings cookieBanner = 21;\n}\n\nenum ResponsiveScalingMode {\n  REFLOW = 0;\n  SCALE = 1;\n}\n\nmessage CMSSelector {\n  string cmsCollectionId = 1;\n  CMSFilterCritera filterCriteria = 2;\n  CMSSelectorSort[] sorts = 3;\n  uint limit = 4;\n}\n\nmessage CMSFilterCritera {\n  CMSFilterCriteriaMatchType matchType = 1;\n  CMSSelectorFilter[] filters = 2;\n}\n\nenum CMSFilterCriteriaMatchType {\n  MATCH_ALL = 0;\n  MATCH_ANY = 1;\n}\n\nmessage CMSSelectorFilter {\n  string cmsFieldId = 1;\n  CMSSelectorFilterOperator op = 2;\n  string comparisonValue = 3;\n}\n\nenum CMSSelectorFilterOperator {\n  EQUALS = 0;\n}\n\nmessage CMSSelectorSort {\n  string cmsFieldId = 1;\n  CMSFieldOrderBy orderBy = 2;\n}\n\nenum CMSFieldOrderBy {\n  ASCENDING = 0;\n  DESCENDING = 1;\n}\n\nmessage CMSConsumptionMap {\n  CMSConsumptionMapEntry[] entries = 1;\n}\n\nmessage CMSConsumptionMapEntry {\n  CMSConsumptionField consumptionField = 1;\n  string cmsFieldId = 2;\n}\n\nenum CMSConsumptionField {\n  MISSING = 0;\n  TEXT_DATA = 1;\n}\n\nmessage CMSRichTextStyleMap {\n  CMSRichTextStyleEntry[] entries = 1;\n}\n\nmessage CMSRichTextStyleEntry {\n  CMSRichTextStyleClass styleClass = 1;\n  CMSRichTextDescriptor textDescriptor = 2;\n}\n\nenum CMSRichTextStyleClass {\n  HEADING1 = 0;\n  HEADING2 = 1;\n  HEADING3 = 2;\n  HEADING4 = 3;\n  HEADING5 = 4;\n  HEADING6 = 5;\n  PARAGRAPH = 6;\n  LINK = 7;\n  BLOCKQUOTE = 8;\n}\n\nmessage CMSRichTextDescriptor {\n  StyleId textStyleId = 1;\n  FontName[] fontNameVariants = 2;\n}\n\nmessage RepeaterCmsOverrideData {\n  NodeChange[] overrides = 1;\n}\n\nmessage RepeaterOverrideData {\n  NodeChange[] parentIndexOverrides = 1;\n}\n\nmessage RepeaterSymbolOverrideData {\n  RepeaterPositionOverrides[] overridesByPosition = 1;\n}\n\nmessage RepeaterPositionOverrides {\n  ParentIndex position = 1;\n  NodeChange[] overrides = 2;\n}\n\nmessage InheritedVariablesData {\n  InheritedVariableEntry[] variableIds = 1;\n}\n\nmessage InheritedVariableEntry {\n  VariableID variableId = 1;\n}\n\nmessage HubFileAttribution {\n  string hubFileId = 1;\n  string hubFileName = 2;\n}\n\nmessage ManagedStringData {\n  string key = 1;\n  string context = 2;\n  string locale = 3;\n  ManagedStringNode content = 4;\n  ManagedStringContentSchema contentSchema = 5;\n}\n\nenum ManagedStringContentSchema {\n  V0 = 0;\n}\n\nenum ManagedStringNodeType {\n  TEXT = 0;\n  CONCATENATE = 1;\n  PLURAL = 2;\n  PLACEHOLDER = 3;\n}\n\nmessage ManagedStringNode {\n  ManagedStringNodeType type = 1;\n  ManagedStringTextNodeData textNodeData = 2;\n  ManagedStringConcatenateAstNodeData concatenateNodeData = 3;\n  ManagedStringPluralAstNodeData pluralNodeData = 4;\n  ManagedStringPlaceholderAstNodeData placeholderNodeData = 5;\n}\n\nmessage ManagedStringTextNodeData {\n  string value = 1;\n}\n\nmessage ManagedStringConcatenateAstNodeData {\n  ManagedStringNode[] values = 1;\n}\n\nenum ManagedStringPluralType {\n  ZERO = 0;\n  ONE = 1;\n  TWO = 2;\n  FEW = 3;\n  MANY = 4;\n  OTHER = 5;\n}\n\nmessage ManagedStringPluralAstNodeData {\n  string identifier = 1;\n  ManagedStringPluralTypeMapEntry[] conditions = 2;\n}\n\nmessage ManagedStringPluralTypeMapEntry {\n  ManagedStringPluralType key = 1;\n  ManagedStringNode value = 2;\n}\n\nenum ManagedStringFormatType {\n  TEXT = 0;\n  DATE = 1;\n  TIME = 2;\n  NUMBER = 3;\n}\n\nmessage ManagedStringPlaceholderAstNodeData {\n  string identifier = 1;\n  ManagedStringFormatType formatType = 2;\n  string formatPattern = 3;\n}\n\nmessage CooperRevertData {\n  NodeChange originalValues = 1;\n}\n\nmessage VideoPlayback {\n  bool autoplay = 1;\n  bool mediaLoop = 2;\n  bool muted = 3;\n  bool showControls = 4;\n  uint startTimeMs = 5;\n  uint endTimeMs = 6;\n}\n\nenum MediaAction {\n  PLAY = 0;\n  PAUSE = 1;\n  TOGGLE_PLAY_PAUSE = 2;\n  MUTE = 3;\n  UNMUTE = 4;\n  TOGGLE_MUTE_UNMUTE = 5;\n  SKIP_FORWARD = 6;\n  SKIP_BACKWARD = 7;\n  SKIP_TO = 8;\n  SET_PLAYBACK_RATE = 9;\n}\n\nenum AnimationTimelineAction {\n  PLAY = 0;\n  PAUSE = 1;\n  TOGGLE_PLAY_PAUSE = 2;\n  SET_PLAYHEAD = 3;\n}\n\nmessage WidgetHoverStyle {\n  Paint[] fillPaints = 1;\n  Paint[] strokePaints = 2;\n  float opacity = 3;\n  bool areFillPaintsSet = 4;\n  bool areStrokePaintsSet = 5;\n  bool isOpacitySet = 6;\n}\n\nmessage WidgetDerivedSubtreeCursor {\n  uint sessionID = 1;\n  uint counter = 2;\n}\n\nmessage MultiplayerMap {\n  MultiplayerMapEntry[] entries = 1;\n}\n\nmessage MultiplayerMapEntry {\n  string key = 1;\n  string value = 2;\n}\n\nmessage VariableDataMap {\n  VariableDataMapEntry[] entries = 1;\n}\n\nmessage VariableDataMapEntry {\n  uint nodeField = 1;\n  VariableData variableData = 2;\n  VariableField variableField = 3;\n}\n\nenum VariableField {\n  MISSING = 0;\n  CORNER_RADIUS = 1;\n  PARAGRAPH_SPACING = 2;\n  PARAGRAPH_INDENT = 3;\n  STROKE_WEIGHT = 4;\n  STACK_SPACING = 5;\n  STACK_PADDING_LEFT = 6;\n  STACK_PADDING_TOP = 7;\n  STACK_PADDING_RIGHT = 8;\n  STACK_PADDING_BOTTOM = 9;\n  VISIBLE = 10;\n  TEXT_DATA = 11;\n  WIDTH = 12;\n  HEIGHT = 13;\n  RECTANGLE_TOP_LEFT_CORNER_RADIUS = 14;\n  RECTANGLE_TOP_RIGHT_CORNER_RADIUS = 15;\n  RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS = 16;\n  RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS = 17;\n  BORDER_TOP_WEIGHT = 18;\n  BORDER_BOTTOM_WEIGHT = 19;\n  BORDER_LEFT_WEIGHT = 20;\n  BORDER_RIGHT_WEIGHT = 21;\n  VARIANT_PROPERTIES = 22;\n  STACK_COUNTER_SPACING = 23;\n  MIN_WIDTH = 24;\n  MAX_WIDTH = 25;\n  MIN_HEIGHT = 26;\n  MAX_HEIGHT = 27;\n  FONT_FAMILY = 28;\n  FONT_STYLE = 29;\n  FONT_VARIATIONS = 30;\n  OPACITY = 31;\n  FONT_SIZE = 32;\n  LETTER_SPACING = 34;\n  LINE_HEIGHT = 36;\n  OVERRIDDEN_SYMBOL_ID = 37;\n  HYPERLINK = 38;\n  CMS_SERIALIZED_RICH_TEXT_DATA = 39;\n  SLOT_CONTENT_ID = 40;\n  GRID_ROW_GAP = 41;\n  GRID_COLUMN_GAP = 42;\n  X_POSITION = 43;\n  Y_POSITION = 44;\n  ROTATION = 45;\n  MOTION_TRANSLATION_X = 46;\n  MOTION_TRANSLATION_Y = 47;\n  MOTION_ROTATION = 48;\n  MOTION_SCALE_X = 49;\n  MOTION_SCALE_Y = 50;\n  MOTION_SHEAR = 51;\n  SCROLL_OFFSET_X = 52;\n  SCROLL_OFFSET_Y = 53;\n  PATH_TRIM_START = 54;\n  PATH_TRIM_END = 55;\n  DISSOLVE_PROGRESS = 56;\n  EASING_DATA = 57;\n  MEDIA_CURRENT_TIME = 58;\n  TRANSFORM_3D_PERSPECTIVE = 59;\n  TRANSFORM_3D_TRANSLATION_Z = 60;\n  TRANSFORM_3D_ROTATION_X = 61;\n  TRANSFORM_3D_ROTATION_Y = 62;\n  TRANSFORM_3D_ROTATION_Z = 63;\n  POLYGON_COUNT = 64;\n  ARC_DATA_STARTING_ANGLE = 65;\n  ARC_DATA_ENDING_ANGLE = 66;\n  ARC_DATA_INNER_RADIUS = 67;\n}\n\nmessage VariableModeBySetMap {\n  VariableModeBySetMapEntry[] entries = 1;\n}\n\nmessage VariableModeBySetMapEntry {\n  VariableSetID variableSetID = 1;\n  GUID variableModeID = 2;\n  VariableSetID variableSetExtensionID = 3;\n}\n\nmessage CodeSyntaxMap {\n  CodeSyntaxMapEntry[] entries = 1;\n}\n\nmessage CodeSyntaxMapEntry {\n  CodeSyntaxPlatform platform = 1;\n  string value = 2;\n}\n\nmessage TableMergedCellMap {\n  TableMergedCellMapEntry[] entries = 1;\n}\n\nmessage TableMergedCellMapEntry {\n  GUID rowId = 1;\n  GUID colId = 2;\n  int rowSpan = 3;\n  int colSpan = 4;\n}\n\nmessage TableRowColumnPositionMap {\n  TableRowColumnPositionMapEntry[] entries = 1;\n}\n\nmessage TableRowColumnPositionMapEntry {\n  GUID id = 1;\n  string position = 2;\n}\n\nmessage GUIDPositionMap {\n  GUIDPositionMapEntry[] entries = 1;\n}\n\nmessage GUIDPositionMapEntry {\n  GUID id = 1;\n  string position = 2;\n}\n\nmessage GUIDGridTrackSizeMap {\n  GUIDGridTrackSizeMapEntry[] entries = 1;\n}\n\nmessage GUIDGridTrackSizeMapEntry {\n  GUID id = 1;\n  GridTrackSize trackSize = 2;\n}\n\nmessage ObjectAnimationList {\n  ObjectAnimationListItem[] entries = 1;\n}\n\nmessage ObjectAnimationListItem {\n  GUID targetNodeId = 1;\n  PrototypeAction animation = 2;\n}\n\nmessage GridTrackSize {\n  GridTrackSizingFunction minSizing = 1;\n  GridTrackSizingFunction maxSizing = 2;\n}\n\nmessage GridTrackSizingFunction {\n  GridTrackSizingType type = 1;\n  float value = 2;\n}\n\nenum GridTrackSizingType {\n  FLEX = 0;\n  FIXED = 1;\n  HUG = 2;\n}\n\nmessage TableRowColumnSizeMap {\n  TableRowColumnSizeMapEntry[] entries = 1;\n}\n\nmessage TableRowColumnSizeMapEntry {\n  GUID id = 1;\n  float size = 2;\n}\n\nmessage AgendaPositionMap {\n  AgendaPositionMapEntry[] entries = 1;\n}\n\nmessage AgendaPositionMapEntry {\n  GUID id = 1;\n  string position = 2;\n}\n\nenum AgendaItemType {\n  NODE = 0;\n  BLOCK = 1;\n}\n\nmessage AgendaMetadataMap {\n  AgendaMetadataMapEntry[] entries = 1;\n}\n\nmessage AgendaMetadataMapEntry {\n  GUID id = 1;\n  AgendaMetadata data = 2;\n}\n\nmessage AgendaMetadata {\n  string name = 1;\n  AgendaItemType type = 2;\n  GUID targetNodeID = 3;\n  AgendaTimerInfo timerInfo = 4;\n  AgendaVoteInfo voteInfo = 5;\n  AgendaMusicInfo musicInfo = 6;\n}\n\nmessage AgendaTimerInfo {\n  uint timerLength = 1;\n}\n\nmessage AgendaVoteInfo {\n  uint voteCount = 1;\n}\n\nmessage AgendaMusicInfo {\n  string songID = 1;\n  uint startTimeMs = 2;\n}\n\nenum DiagramLayoutRuleType {\n  NONE = 0;\n  TREE = 1;\n}\n\nstruct DiagramParentIndex {\n  GUID guid;\n  string position;\n}\n\nenum DiagramLayoutPaused {\n  NO = 0;\n  YES = 1;\n}\n\nmessage ComponentPropRef {\n  uint nodeField = 1;\n  GUID defID = 2;\n  string zombieFallbackName = 3;\n  ComponentPropNodeField componentPropNodeField = 4;\n  bool isDeleted = 5;\n}\n\nenum ComponentPropNodeField {\n  VISIBLE = 0;\n  TEXT_DATA = 1;\n  OVERRIDDEN_SYMBOL_ID = 2;\n  INHERIT_FILL_STYLE_ID = 3;\n  SLOT_CONTENT_ID = 4;\n}\n\nmessage ComponentPropAssignment {\n  GUID defID = 1;\n  ComponentPropValue value = 2;\n  VariableData varValue = 3;\n  DerivedTextData legacyDerivedTextData = 4;\n}\n\nmessage ComponentPropDef {\n  GUID id = 1;\n  string name = 2;\n  ComponentPropValue initialValue = 3;\n  string sortPosition = 4;\n  GUID parentPropDefId = 5;\n  ComponentPropType type = 6;\n  bool isDeleted = 7;\n  ComponentPropPreferredValues preferredValues = 8;\n  VariableData varValue = 9;\n  ParameterConfig parameterConfig = 10;\n  string description = 11;\n  SlotPropConfig slotPropConfig = 12;\n  ColorArrayConfig colorArrayConfig = 13;\n}\n\nmessage ComponentPropValue {\n  bool boolValue = 1;\n  TextData textValue = 2;\n  GUID guidValue = 3;\n  float floatValue = 4;\n  EasingData easingData = 5;\n  Vector vectorValue = 6;\n  Line lineValue = 7;\n  Circle circleValue = 8;\n  Rotation3D rotation3DValue = 9;\n  CirclePoint circlePointValue = 10;\n  Gradient gradientValue = 11;\n  ColorPoint colorPointValue = 12;\n}\n\nmessage TimelineData {\n  uint64 durationUs = 1;\n  bool defaultTimeline = 2;\n  GUID parentTimelineDefId = 3;\n  PlaybackStyle playbackStyle = 4;\n}\n\nmessage TimelineDefinitionsMap {\n  TimelineDefinitionsMapEntry[] entries = 1;\n}\n\nmessage TimelineDefinitionsMapEntry {\n  GUID id = 1;\n  TimelineData data = 2;\n}\n\nmessage TimelineAssignmentKey {\n  GUID assignedTimelineId = 1;\n  GUID containingTimelineId = 2;\n}\n\nmessage TimelineBindingData {\n  int64 offsetUs = 1;\n  bool disabled = 2;\n}\n\nmessage TimelineAssignmentsMap {\n  TimelineAssignmentsMapEntry[] entries = 1;\n}\n\nmessage TimelineAssignmentsMapEntry {\n  TimelineAssignmentKey key = 1;\n  TimelineBindingData value = 2;\n}\n\nenum ComponentPropType {\n  BOOL = 0;\n  TEXT = 1;\n  COLOR = 2;\n  INSTANCE_SWAP = 3;\n  VARIANT = 4;\n  NUMBER = 5;\n  IMAGE = 6;\n  SLOT = 7;\n  EASING = 8;\n  COLOR_ARRAY = 9;\n  VECTOR = 10;\n  LINE = 11;\n  CIRCLE = 12;\n  ROTATION_3D = 13;\n  CIRCLE_POINT = 14;\n  GRADIENT = 15;\n  COLOR_POINT = 16;\n}\n\nmessage ComponentPropPreferredValues {\n  string[] stringValues = 1;\n  InstanceSwapPreferredValue[] instanceSwapValues = 2;\n}\n\nmessage ParameterConfig {\n  NumberPropConfig numberPropConfig = 1;\n  ParameterConfigControl control = 2;\n  SliderConfig sliderConfig = 3;\n  VariableData label = 4;\n  InputConfig inputConfig = 5;\n  SelectConfig selectConfig = 6;\n  PointConfig pointConfig = 7;\n  LineConfig lineConfig = 8;\n  PointRadiusConfig pointRadiusConfig = 9;\n  Rotation3DConfig rotation3DConfig = 10;\n  CirclePointConfig circlePointConfig = 11;\n  ColorPointConfig colorPointConfig = 12;\n  bool showDividerAbove = 13;\n}\n\nenum ParameterConfigControl {\n  DEFAULT = 0;\n  SLIDER = 1;\n  INPUT = 2;\n  SELECT = 3;\n}\n\nmessage InputConfig {\n  VariableData unit = 1;\n  VariableData min = 2;\n  VariableData max = 3;\n}\n\nmessage SliderConfig {\n  VariableData min = 1;\n  VariableData max = 2;\n  VariableData step = 3;\n  VariableData unit = 4;\n}\n\nenum PointMode {\n  CANVAS_AND_UI = 0;\n  CANVAS = 1;\n  UI = 2;\n}\n\nmessage PointConfig {\n  PointMode mode = 1;\n  NumberUnits unit = 2;\n}\n\nmessage Line {\n  Vector a = 1;\n  Vector b = 2;\n}\n\nmessage LineConfig {\n  PointMode mode = 1;\n  NumberUnits unit = 2;\n}\n\nmessage Circle {\n  Vector center = 1;\n  float radius = 2;\n}\n\nmessage PointRadiusConfig {\n  PointMode mode = 1;\n  NumberUnits positionUnit = 2;\n  NumberUnits radiusUnit = 3;\n  float minRadius = 4;\n  float maxRadius = 5;\n}\n\nmessage Rotation3D {\n  float x = 1;\n  float y = 2;\n  float z = 3;\n  float translateZ = 4;\n}\n\nmessage Rotation3DConfig {\n  PointMode mode = 1;\n}\n\nmessage CirclePoint {\n  Vector center = 1;\n  float radius = 2;\n  float angle = 3;\n}\n\nmessage CirclePointConfig {\n  PointMode mode = 1;\n  NumberUnits positionUnit = 2;\n  NumberUnits radiusUnit = 3;\n  float minRadius = 4;\n  float maxRadius = 5;\n}\n\nmessage ColorPoint {\n  Vector point = 1;\n  VariableData color = 2;\n}\n\nmessage ColorPointConfig {\n  PointMode mode = 1;\n  NumberUnits unit = 2;\n}\n\nmessage Gradient {\n  GradientStop[] stops = 1;\n}\n\nmessage GradientStop {\n  float position = 1;\n  VariableData color = 2;\n}\n\nmessage SelectOption {\n  VariableData value = 1;\n  string label = 2;\n}\n\nmessage SelectConfig {\n  SelectOption[] options = 1;\n}\n\nmessage ColorArrayConfig {\n  uint minLength = 1;\n  uint maxLength = 2;\n}\n\nmessage SlotPropConfig {\n  bool stretchChildOnInsert = 1;\n  bool displayByDefault = 2;\n  uint minChildren = 3;\n  uint maxChildren = 4;\n  bool allowPreferredValuesOnly = 5;\n}\n\nmessage NumberPropConfig {\n  ParameterConfigControl control = 1;\n  VariableData min = 2;\n  VariableData max = 3;\n  VariableData step = 4;\n}\n\nmessage InstanceSwapPreferredValue {\n  InstanceSwapPreferredValueType type = 1;\n  string key = 2;\n}\n\nenum InstanceSwapPreferredValueType {\n  COMPONENT = 0;\n  STATE_GROUP = 1;\n}\n\nenum WidgetEvent {\n  MOUSE_DOWN = 0;\n  CLICK = 1;\n  TEXT_EDIT_END = 2;\n  ATTACHED_STICKABLES_CHANGED = 3;\n  STUCK_STATUS_CHANGED = 4;\n}\n\nenum WidgetInputBehavior {\n  WRAP = 0;\n  TRUNCATE = 1;\n  MULTILINE = 2;\n}\n\nmessage WidgetMetadata {\n  string pluginID = 1;\n  string pluginVersionID = 2;\n  string widgetName = 3;\n  bool isResizable = 4;\n  bool isRotatable = 5;\n}\n\nenum WidgetPropertyMenuItemType {\n  ACTION = 0;\n  SEPARATOR = 1;\n  COLOR = 2;\n  DROPDOWN = 3;\n  COLOR_SELECTOR = 4;\n  TOGGLE = 5;\n  LINK = 6;\n}\n\nmessage WidgetPropertyMenuSelectorOption {\n  string option = 1;\n  string tooltip = 2;\n}\n\nenum WidgetInputTextNodeType {\n  WIDGET_CONTROLLED = 0;\n  RICH_TEXT = 1;\n}\n\nmessage WidgetPropertyMenuItem {\n  string propertyName = 1;\n  string tooltip = 2;\n  WidgetPropertyMenuItemType itemType = 3;\n  string icon = 4;\n  WidgetPropertyMenuSelectorOption[] options = 5;\n  string selectedOption = 6;\n  bool isToggled = 7;\n  string href = 8;\n  bool allowCustomColor = 9;\n}\n\nenum CodeBlockLanguage {\n  TYPESCRIPT = 0;\n  CPP = 1;\n  RUBY = 2;\n  CSS = 3;\n  JAVASCRIPT = 4;\n  HTML = 5;\n  JSON = 6;\n  GRAPHQL = 7;\n  PYTHON = 8;\n  GO = 9;\n  SQL = 10;\n  SWIFT = 11;\n  KOTLIN = 12;\n  RUST = 13;\n  BASH = 14;\n  PLAINTEXT = 15;\n  MARKDOWN = 16;\n}\n\nenum CodeBlockTheme {\n  FIGJAM_DARK = 0;\n  DRACULA = 1;\n  DUOTONE_SEA = 2;\n  DUOTONE_SPACE = 3;\n  DUOTONE_EARTH = 4;\n  DUOTONE_FOREST = 5;\n  DUOTONE_LIGHT = 6;\n}\n\nenum SpecBlockType {\n  DEFAULT = 0;\n  PARAGRAPH = 1;\n  HEADING_1 = 2;\n  HEADING_2 = 3;\n  HEADING_3 = 4;\n  HEADING_4 = 5;\n  HEADING_5 = 6;\n  HEADING_6 = 7;\n  CODE_BLOCK = 8;\n  BLOCK_QUOTE = 9;\n  HORIZONTAL_RULE = 10;\n  ORDERED_LIST_ITEM = 11;\n  UNORDERED_LIST_ITEM = 12;\n  DOCUMENT = 13;\n  TABLE = 14;\n  TABLE_ROW = 15;\n  TABLE_CELL = 16;\n  TODO_LIST_ITEM_UNCHECKED = 17;\n  TODO_LIST_ITEM_CHECKED = 18;\n  IMAGE = 19;\n  EMBED = 20;\n}\n\nenum InternalEnumForTest {\n  OLD = 1;\n}\n\nmessage InternalDataForTest {\n  int testFieldA = 1;\n}\n\nmessage StateGroupPropertyValueOrder {\n  string property = 1;\n  string[] values = 2;\n}\n\nenum BackfillError {\n  NONE = 0;\n  TRANSIENT_RETRYING = 1;\n  PERMANENTLY_FAILED = 2;\n  PASTE_FAILED = 3;\n}\n\nmessage PartialPasteAnnotation {\n  bool isPartial = 1;\n  uint64 annotatedAt = 2;\n  BackfillError errorState = 3;\n}\n\nmessage VariantPropSpec {\n  GUID propDefId = 1;\n  string value = 2;\n}\n\nmessage TextListData {\n  int listID = 1;\n  BulletType bulletType = 2;\n  int indentationLevel = 3;\n  int lineNumber = 4;\n}\n\nenum BulletType {\n  ORDERED = 0;\n  UNORDERED = 1;\n  INDENT = 2;\n  NO_LIST = 3;\n}\n\nmessage TextLineData {\n  LineType lineType = 1;\n  int styleId = 10;\n  int indentationLevel = 2;\n  SourceDirectionality sourceDirectionality = 9;\n  Directionality directionality = 3;\n  DirectionalityIntent directionalityIntent = 4;\n  int downgradeStyleId = 5;\n  int consistencyStyleId = 6;\n  int listStartOffset = 7;\n  bool isFirstLineOfList = 8;\n}\n\nmessage DerivedTextLineData {\n  Directionality directionality = 1;\n}\n\nenum LineType {\n  PLAIN = 0;\n  ORDERED_LIST = 1;\n  UNORDERED_LIST = 2;\n  BLOCKQUOTE = 3;\n  HEADER = 4;\n}\n\nenum SourceDirectionality {\n  AUTO = 0;\n  LTR = 1;\n  RTL = 2;\n}\n\nenum Directionality {\n  LTR = 0;\n  RTL = 1;\n}\n\nenum DirectionalityIntent {\n  IMPLICIT = 0;\n  EXPLICIT = 1;\n}\n\nmessage PrototypeInteraction {\n  GUID id = 1;\n  PrototypeEvent event = 2;\n  PrototypeAction[] actions = 3;\n  bool isDeleted = 4;\n  int stateManagementVersion = 5;\n}\n\nmessage PrototypeEvent {\n  InteractionType interactionType = 1;\n  bool interactionMaintained = 2;\n  float interactionDuration = 3;\n  KeyTrigger keyTrigger = 4;\n  string voiceEventPhrase = 5;\n  float transitionTimeout = 6;\n  float mediaHitTime = 7;\n}\n\nmessage PrototypeVariableTarget {\n  VariableID id = 1;\n  NodeFieldAlias nodeFieldAlias = 2;\n}\n\nmessage ConditionalActions {\n  PrototypeAction[] actions = 1;\n  VariableData condition = 2;\n}\n\nmessage PrototypeAction {\n  GUID transitionNodeID = 1;\n  TransitionType transitionType = 2;\n  float transitionDuration = 3;\n  EasingType easingType = 4;\n  float transitionTimeout = 5;\n  bool transitionShouldSmartAnimate = 6;\n  ConnectionType connectionType = 7;\n  Vector overlayRelativePosition = 9;\n  NavigationType navigationType = 10;\n  bool transitionPreserveScroll = 11;\n  float[] easingFunction = 12;\n  Vector extraScrollOffset = 13;\n  bool transitionResetScrollPosition = 25;\n  bool transitionResetInteractiveComponents = 26;\n  bool transitionOverridesEnabled = 42;\n  string connectionURL = 8;\n  bool openUrlInNewTab = 18;\n  VariableData linkParam = 34;\n  CMSItemPageTarget cmsTarget = 35;\n  GUID targetVariableID = 14;\n  VariableAnyValue targetVariableValue = 15;\n  PrototypeVariableTarget targetVariable = 19;\n  VariableData targetVariableData = 20;\n  MediaAction mediaAction = 16;\n  bool transitionResetVideoPosition = 17;\n  float mediaSkipToTime = 21;\n  float mediaSkipByAmount = 22;\n  float mediaPlaybackRate = 36;\n  VariableData[] conditions = 23;\n  ConditionalActions[] conditionalActions = 24;\n  VariableSetID targetVariableSetID = 27;\n  GUID targetVariableModeID = 28;\n  string targetVariableSetKey = 29;\n  VariableSetID variableSetTargetExtensionId = 38;\n  AnimationType animationType = 30;\n  GUID animationTargetId = 31;\n  AnimationPhase animationPhase = 32;\n  AnimationState animationState = 33;\n  bool simpleLink = 37;\n  AnimationTimelineAction animationTimelineAction = 39;\n  GUID animationTimelineDefId = 41;\n  float animationSkipToTime = 40;\n}\n\nenum AnimationPhase {\n  IN = 0;\n  OUT = 1;\n}\n\nenum AnimationType {\n  NONE = 0;\n  FADE = 1;\n  SLIDE_FROM_LEFT = 2;\n  SLIDE_FROM_RIGHT = 3;\n  SLIDE_FROM_TOP = 4;\n  SLIDE_FROM_BOTTOM = 5;\n}\n\nmessage AnimationState {\n  float opacity = 1;\n  Matrix transform = 2;\n}\n\nmessage PrototypeStartingPoint {\n  string name = 1;\n  string description = 2;\n  string position = 3;\n}\n\nenum TriggerDevice {\n  KEYBOARD = 0;\n  UNKNOWN_CONTROLLER = 1;\n  XBOX_ONE = 2;\n  PS4 = 3;\n  SWITCH_PRO = 4;\n}\n\nmessage KeyTrigger {\n  int[] keyCodes = 1;\n  TriggerDevice triggerDevice = 2;\n}\n\nmessage Hyperlink {\n  string url = 1;\n  GUID guid = 2;\n  CMSItemPageTarget cmsTarget = 4;\n  bool openInNewTab = 3;\n}\n\nmessage CMSItemPageTarget {\n  GUID nodeId = 1;\n  string cmsItemId = 2;\n  string fieldSchemaId = 3;\n}\n\nenum MentionSource {\n  DEFAULT = 0;\n  COPY_DUPLICATE = 1;\n  SILENT_INSERT = 2;\n}\n\nmessage Mention {\n  GUID id = 1;\n  string mentionedUserId = 2;\n  string mentionedByUserId = 3;\n  string fileKey = 4;\n  MentionSource source = 5;\n  uint64 mentionedUserIdInt = 6;\n  uint64 mentionedByUserIdInt = 7;\n  string mentionedUserGroupId = 8;\n}\n\nmessage EmbedData {\n  string url = 1;\n  string srcUrl = 2;\n  string title = 3;\n  string thumbnailUrl = 4;\n  float width = 5;\n  float height = 6;\n  string embedType = 7;\n  string thumbnailImageHash = 8;\n  string faviconImageHash = 9;\n  string provider = 10;\n  string originalText = 11;\n  string description = 12;\n  string embedVersionId = 13;\n  bool isPublishedSite = 14;\n}\n\nmessage StampData {\n  string userId = 1;\n  string votingSessionId = 2;\n  string stampedByUserId = 3;\n}\n\nmessage LinkPreviewData {\n  string url = 1;\n  string title = 2;\n  string provider = 3;\n  string description = 4;\n  string thumbnailImageHash = 5;\n  string faviconImageHash = 6;\n  float thumbnailImageWidth = 7;\n  float thumbnailImageHeight = 8;\n}\n\nmessage Viewport {\n  Rect canvasSpaceBounds = 1;\n  bool pixelPreview = 2;\n  float pixelDensity = 3;\n  GUID canvasGuid = 4;\n}\n\nmessage Mouse {\n  MouseCursor cursor = 1;\n  Vector canvasSpaceLocation = 2;\n  Rect canvasSpaceSelectionBox = 3;\n  GUID canvasGuid = 4;\n  uint cursorHiddenReason = 5;\n}\n\nstruct Click {\n  uint id;\n  Vector point;\n}\n\nstruct ScrollPosition {\n  GUID node;\n  Vector scrollOffset;\n}\n\nstruct TriggeredOverlay {\n  GUID overlayGuid;\n  GUID hotspotGuid;\n  GUID swapGuid;\n}\n\nmessage TriggeredOverlayData {\n  GUID overlayGuid = 1;\n  GUID hotspotGuid = 2;\n  GUID swapGuid = 3;\n  GUID prototypeInteractionGuid = 4;\n  GUIDPath hotspotBlueprintId = 5;\n}\n\nmessage TriggeredSetVariableActionData {\n  GUID nodeForFindingTopmostScreenId = 1;\n  string targetVariableId = 2;\n  string targetVariableData = 3;\n  string resolvedVariableModes = 4;\n}\n\nmessage TriggeredSetVariableModeActionData {\n  GUID nodeForFindingTopmostScreenId = 1;\n  string targetVariableSetKey = 2;\n  string targetVariableModeId = 3;\n  VariableSetID targetVariableSetId = 4;\n}\n\nmessage VideoStateChangeData {\n  GUID targetNodeId = 1;\n  bool isPlaying = 2;\n  bool isPlayingSound = 3;\n  uint[] currentTimes = 4;\n  uint actionTakenTimestamp = 5;\n}\n\nmessage EmbeddedPrototypeData {\n  GUID nodeId = 1;\n  uint sessionId = 2;\n}\n\nmessage PresentedState {\n  GUID baseScreenID = 1;\n  TriggeredOverlayData[] overlays = 2;\n}\n\nenum TransitionDirection {\n  FORWARD = 0;\n  REVERSE = 1;\n}\n\nmessage TopLevelPlaybackChange {\n  PresentedState oldState = 1;\n  PresentedState newState = 2;\n  GUIDPath hotspotBlueprintID = 3;\n  GUID interactionID = 4;\n  bool isHotspotInNewPresentedState = 5;\n  TransitionDirection direction = 6;\n  GUIDPath instanceStablePath = 7;\n}\n\nmessage InstanceStateChange {\n  GUID stateID = 1;\n  GUID interactionID = 2;\n  GUIDPath hotspotStablePath = 3;\n  GUIDPath instanceStablePath = 4;\n  PlaybackChangePhase phase = 5;\n}\n\nmessage TextCursor {\n  Rect selectionBox = 1;\n  GUID canvasGuid = 2;\n  GUID textNodeGuid = 3;\n}\n\nmessage TextSelection {\n  Rect[] selectionBoxes = 1;\n  GUID canvasGuid = 2;\n  GUID textNodeGuid = 3;\n  Vector textSelectionRange = 4;\n  GUID textNodeOrContainingIfGuid = 5;\n  GUID tableCellRowId = 6;\n  GUID tableCellColId = 7;\n}\n\nenum PlaybackChangePhase {\n  INITIATED = 0;\n  ABORTED = 1;\n  COMMITTED = 2;\n}\n\nmessage PlaybackChangeKeyframe {\n  PlaybackChangePhase phase = 1;\n  float progress = 2;\n  float timestamp = 3;\n}\n\nmessage StateMapping {\n  GUIDPath stablePath = 1;\n  TopLevelPlaybackChange lastTopLevelChange = 2;\n  PlaybackChangeKeyframe lastTopLevelChangeStatus = 3;\n  float timestamp = 4;\n}\n\nmessage ScrollMapping {\n  GUIDPath blueprintID = 1;\n  uint overlayIndex = 2;\n  Vector scrollOffset = 3;\n}\n\nmessage PlaybackUpdate {\n  TopLevelPlaybackChange lastTopLevelChange = 1;\n  PlaybackChangeKeyframe lastTopLevelChangeStatus = 2;\n  ScrollMapping[] scrollMappings = 3;\n  float timestamp = 4;\n  Vector pointerLocation = 5;\n  bool isTopLevelFrameChange = 6;\n  StateMapping[] stateMappings = 7;\n}\n\nmessage ChatMessage {\n  string text = 1;\n  string previousText = 2;\n}\n\nmessage VoiceMetadata {\n  string connectedCallId = 1;\n}\n\nmessage AprilFunCursor {\n  string id = 1;\n  bool trailEnabled = 2;\n}\n\nmessage AprilFunFigPal {\n  string customization = 1;\n  string name = 2;\n}\n\nenum Heartbeat {\n  FOREGROUND = 0;\n  BACKGROUND = 1;\n}\n\nenum SitesViewState {\n  FILE = 0;\n  CODE = 1;\n  DAKOTA = 2;\n  SETTINGS = 3;\n  INSERT = 4;\n  VARIABLES = 5;\n}\n\nenum DesignFullPageViewState {\n  NONE = 0;\n  DESIGN_SYSTEM = 1;\n  VARIABLES = 2;\n}\n\nmessage AgentInfo {\n  string name = 1;\n  string logo = 2;\n  string oauthClientId = 3;\n}\n\nmessage UserChange {\n  uint sessionID = 1;\n  string stableSessionID = 44;\n  bool connected = 2;\n  string name = 3;\n  Color color = 4;\n  string imageURL = 5;\n  Viewport viewport = 6;\n  Mouse mouse = 7;\n  GUID[] selection = 8;\n  uint[] observing = 9;\n  string deviceName = 10;\n  Click[] recentClicks = 11;\n  ScrollPosition[] scrollPositions = 12;\n  TriggeredOverlay[] triggeredOverlays = 13;\n  string userID = 14;\n  GUID lastTriggeredHotspot = 15;\n  GUID lastTriggeredPrototypeInteractionID = 16;\n  uint lastTriggeredObjectAnimationIndex = 38;\n  TriggeredOverlayData[] triggeredOverlaysData = 17;\n  PlaybackUpdate[] playbackUpdates = 18;\n  ChatMessage chatMessage = 19;\n  VoiceMetadata voiceMetadata = 20;\n  bool canWrite = 21;\n  bool highFiveStatus = 22;\n  InstanceStateChange[] instanceStateChanges = 23;\n  TextCursor textCursor = 24;\n  TextSelection textSelection = 25;\n  uint connectedAtTimeS = 26;\n  bool focusOnTextCursor = 27;\n  Heartbeat heartbeat = 28;\n  TriggeredSetVariableActionData[] triggeredSetVariableActionData = 29;\n  VideoStateChangeData[] videoStateChangeData = 30;\n  string clientID = 31;\n  GUID focusedSlideId = 32;\n  TriggeredSetVariableModeActionData[] triggeredSetVariableModeActionData = 33;\n  AprilFunCursor aprilFunCursor = 34;\n  EmbeddedPrototypeData[] embeddedPrototypeData = 35;\n  GUID activeSlidesEmbeddablePrototype = 36;\n  GUID[] activeEmbeddedPrototypes = 43;\n  GUID activeCodeComponentId = 37;\n  AprilFunFigPal aprilFunFigPal = 39;\n  CollaborativeTextSelection collaborativeTextSelection = 40;\n  SitesViewState sitesViewState = 41;\n  NodeChatExchange[] nodeChatExchanges = 42;\n  DesignFullPageViewState designFullPageViewState = 45;\n  AgentInfo agentInfo = 46;\n}\n\nmessage InteractiveSlideElementChange {\n  string userID = 1;\n  string anonymousUserID = 2;\n  GUID nodeID = 3;\n  string responseData = 4;\n}\n\nmessage NodeStatusChange {\n  GUID[] nodeIds = 1;\n  SectionStatusInfo statusInfo = 2;\n}\n\nmessage BuzzApprovalAssetEntry {\n  GUID assetNodeId = 1;\n  bool approved = 2;\n}\n\nmessage BuzzApprovalChange {\n  BuzzApprovalAssetEntry[] assetEntries = 1;\n  GUID canvasGridNodeId = 2;\n  string requestId = 3;\n}\n\nenum SceneGraphQueryBehavior {\n  DEFAULT = 0;\n  CONTAINING_PAGE = 1;\n  PLUGIN = 2;\n}\n\nenum SceneGraphQueryMode {\n  ADD = 0;\n  SET = 1;\n}\n\nmessage SceneGraphQuery {\n  GUID startingNode = 1;\n  uint depth = 2;\n  SceneGraphQueryBehavior behavior = 3;\n}\n\nmessage NodeChangesMetadata {\n  uint blobsFieldOffset = 1;\n}\n\nmessage CursorReaction {\n  string imageUrl = 1;\n}\n\nmessage TimerInfo {\n  bool isPaused = 1;\n  uint timeRemainingMs = 2;\n  uint totalTimeMs = 3;\n  uint timerID = 4;\n  string setBy = 5;\n  uint songID = 6;\n  uint lastReceivedSongTimestampMs = 7;\n  string songUUID = 8;\n}\n\nmessage MusicInfo {\n  bool isPaused = 1;\n  uint messageID = 2;\n  string songID = 3;\n  uint lastReceivedSongTimestampMs = 4;\n  bool isStopped = 5;\n}\n\nmessage PresenterNomination {\n  uint sessionID = 1;\n  bool isCancelled = 2;\n}\n\nmessage PresenterInfo {\n  uint sessionID = 1;\n  PresenterNomination nomination = 2;\n  bool isReconnected = 3;\n}\n\nmessage ClientBroadcast {\n  uint sessionID = 1;\n  CursorReaction cursorReaction = 2;\n  TimerInfo timer = 3;\n  PresenterInfo presenter = 4;\n  PresenterInfo prototypePresenter = 5;\n  MusicInfo music = 6;\n}\n\nenum PasteAssetType {\n  UNKNOWN = 0;\n  VARIABLE = 1;\n}\n\nmessage Message {\n  MessageType type = 1;\n  uint sessionID = 2;\n  string stableSessionID = 42;\n  uint ackID = 3;\n  bool isRetransmission = 37;\n  NodeChange[] nodeChanges = 4;\n  UserChange[] userChanges = 5;\n  InteractiveSlideElementChange interactiveSlideElementChange = 32;\n  NodeStatusChange nodeStatusChange = 36;\n  BuzzApprovalChange buzzApprovalChange = 44;\n  Blob[] blobs = 6;\n  uint blobBaseIndex = 30;\n  string signalName = 7;\n  Access access = 8;\n  string styleSetName = 9;\n  StyleSetType styleSetType = 10;\n  StyleSetContentType styleSetContentType = 11;\n  int pasteID = 12;\n  Vector pasteOffset = 13;\n  string pasteFileKey = 14;\n  string signalPayload = 15;\n  SceneGraphQuery[] sceneGraphQueries = 16;\n  NodeChangesMetadata nodeChangesMetadata = 17;\n  uint fileVersion = 18;\n  bool pasteIsPartiallyOutsideEnclosingFrame = 19;\n  GUID pastePageId = 20;\n  bool isCut = 21;\n  Message[] localUndoStack = 22;\n  Message[] localRedoStack = 23;\n  ClientBroadcast[] broadcasts = 24;\n  uint reconnectSequenceNumber = 25;\n  string pasteBranchSourceFileKey = 26;\n  EditorType pasteEditorType = 27;\n  string postSyncActions = 28;\n  GUID[] publishedAssetGuids = 29;\n  bool dirtyFromInitialLoad = 31;\n  ClipboardSelectionRegion[] clipboardSelectionRegions = 33;\n  EncodedOffsetsIndex encodedOffsetsIndex = 34;\n  bool hasRepeatingContent = 35;\n  uint64 sentTimestamp = 38;\n  AnnotationCategory[] annotationCategories = 39;\n  ClientRenderedMetadata clientRenderedMetadata = 40;\n  PasteAssetType pasteAssetType = 41;\n  ObjectAnimationList objectAnimations = 43;\n  SceneGraphQueryMode sceneGraphQueryMode = 45;\n}\n\nmessage EncodedOffsetsIndex {\n  uint nodeChangesFieldOffset = 1;\n  uint nodeChangesFieldLength = 2;\n  uint blobsFieldOffset = 3;\n  GUIDAndEncodedOffset[] nodeChangeOffsets = 4;\n}\n\nstruct GUIDAndEncodedOffset {\n  GUID guid;\n  uint offset;\n}\n\nmessage DiffChunk {\n  uint[] nodeChanges = 1;\n  NodePhase phase = 2;\n  NodeChange displayNode = 3;\n  GUID canvasId = 4;\n  string canvasName = 5;\n  bool canvasIsInternal = 6;\n  uint[] chunksAffectingThisChunk = 7;\n  NodeChange[] basisParentHierarchy = 8;\n  NodeChange[] parentHierarchy = 9;\n  GUID[] basisParentHierarchyGuids = 10;\n  GUID[] parentHierarchyGuids = 11;\n}\n\nenum DiffType {\n  BRANCHING = 0;\n  NODE_CHANGES_ONLY = 1;\n}\n\nmessage DiffPayload {\n  NodeChange[] nodeChanges = 1;\n  Blob[] blobs = 2;\n  DiffChunk[] diffChunks = 3;\n  NodeChange[] diffBasis = 4;\n  NodeChange[] basisParentNodeChanges = 5;\n  NodeChange[] parentNodeChanges = 6;\n  DiffType diffType = 7;\n}\n\nenum RichMediaType {\n  ANIMATED_IMAGE = 0;\n  VIDEO = 1;\n}\n\nmessage RichMediaData {\n  string mediaHash = 1;\n  RichMediaType richMediaType = 2;\n}\n\nenum VariableDataType {\n  BOOLEAN = 0;\n  FLOAT = 1;\n  STRING = 2;\n  ALIAS = 3;\n  COLOR = 4;\n  EXPRESSION = 5;\n  MAP = 6;\n  SYMBOL_ID = 7;\n  FONT_STYLE = 8;\n  TEXT_DATA = 9;\n  INVALID = 10;\n  NODE_FIELD_ALIAS = 11;\n  CMS_ALIAS = 12;\n  PROP_REF = 13;\n  IMAGE = 14;\n  MANAGED_STRING_ALIAS = 15;\n  LINK = 16;\n  JS_RUNTIME_ALIAS = 17;\n  SLOT_CONTENT_ID = 18;\n  DATE = 19;\n  KEYFRAME_TRACK_ID = 20;\n  KEYFRAME_TRACK_PARAMETER_DATA = 21;\n  EASING = 22;\n  TIMING = 23;\n  VECTOR = 24;\n  COLOR_ARRAY = 25;\n  LINE = 26;\n  CIRCLE = 27;\n  ROTATION_3D = 28;\n  CIRCLE_POINT = 29;\n  GRADIENT = 30;\n  COLOR_POINT = 31;\n}\n\nenum VariableResolvedDataType {\n  BOOLEAN = 0;\n  FLOAT = 1;\n  STRING = 2;\n  COLOR = 4;\n  MAP = 5;\n  SYMBOL_ID = 6;\n  FONT_STYLE = 7;\n  TEXT_DATA = 8;\n  IMAGE = 9;\n  LINK = 10;\n  JS_RUNTIME_ALIAS = 11;\n  SLOT_CONTENT_ID = 12;\n  KEYFRAME_TRACK_ID = 13;\n  KEYFRAME_TRACK_PARAMETER_DATA = 14;\n  EASING = 15;\n  TIMING = 16;\n  VECTOR = 17;\n  COLOR_ARRAY = 18;\n  LINE = 19;\n  CIRCLE = 20;\n  ROTATION_3D = 21;\n  CIRCLE_POINT = 22;\n  GRADIENT = 23;\n  COLOR_POINT = 24;\n}\n\nmessage VariableAnyValue {\n  bool boolValue = 1;\n  string textValue = 2;\n  float floatValue = 3;\n  VariableID alias = 4;\n  Color colorValue = 5;\n  Expression expressionValue = 6;\n  VariableMap mapValue = 7;\n  SymbolId symbolIdValue = 8;\n  VariableFontStyle fontStyleValue = 9;\n  TextData textDataValue = 10;\n  NodeFieldAlias nodeFieldAliasValue = 11;\n  CMSAlias cmsAliasValue = 12;\n  PropRefValue propRefValue = 13;\n  ImageParameterValue imageValue = 14;\n  ManagedStringAlias managedStringAliasValue = 15;\n  Hyperlink linkValue = 16;\n  JsRuntimeAlias jsRuntimeAliasValue = 17;\n  SlotContentId slotContentIdValue = 18;\n  KeyframeTrackId keyframeTrackIdValue = 19;\n  KeyframeTrackParameterValue keyframeTrackParameterValue = 20;\n  EasingData easingValue = 21;\n  Vector vectorValue = 22;\n  ColorArray colorArrayValue = 23;\n  Line lineValue = 24;\n  Circle circleValue = 25;\n  Rotation3D rotation3DValue = 26;\n  CirclePoint circlePointValue = 27;\n  Gradient gradientValue = 28;\n  ColorPoint colorPointValue = 29;\n}\n\nenum ExpressionFunction {\n  ADDITION = 0;\n  SUBTRACTION = 1;\n  RESOLVE_VARIANT = 2;\n  MULTIPLY = 3;\n  DIVIDE = 4;\n  EQUALS = 5;\n  NOT_EQUAL = 6;\n  LESS_THAN = 7;\n  LESS_THAN_OR_EQUAL = 8;\n  GREATER_THAN = 9;\n  GREATER_THAN_OR_EQUAL = 10;\n  AND = 11;\n  OR = 12;\n  NOT = 13;\n  STRINGIFY = 14;\n  TERNARY = 15;\n  VAR_MODE_LOOKUP = 16;\n  NEGATE = 17;\n  IS_TRUTHY = 18;\n  KEYFRAME = 19;\n}\n\nmessage Expression {\n  ExpressionFunction expressionFunction = 1;\n  VariableData[] expressionArguments = 2;\n}\n\nmessage VariableMapValue {\n  string key = 1;\n  VariableData value = 2;\n  GUID guidKey = 3;\n}\n\nmessage VariableMap {\n  VariableMapValue[] values = 1;\n}\n\nmessage ColorArray {\n  VariableData[] colors = 1;\n}\n\nmessage VariableFontStyle {\n  VariableData asString = 1;\n  VariableData asFloat = 2;\n  VariableData asVariations = 3;\n}\n\nmessage ImageParameterValue {\n  Image image = 1;\n  Image imageThumbnail = 2;\n  Image animatedImage = 6;\n  string altText = 3;\n  uint originalImageHeight = 4;\n  uint originalImageWidth = 5;\n  uint animationFrame = 7;\n}\n\nmessage ThumbnailInfo {\n  GUID nodeID = 1;\n  string thumbnailVersion = 2;\n}\n\nmessage AiCanvasPrompt {\n  string userPrompt = 1;\n  string authorId = 2;\n  GUID[] parentNodeIds = 3;\n}\n\nmessage NodeFieldAlias {\n  GUIDPath stablePathToNode = 1;\n  NodeFieldAliasType nodeField = 2;\n  string indexOrKey = 3;\n}\n\nenum NodeFieldAliasType {\n  MISSING = 0;\n  COMPONENT_PROP_ASSIGNMENTS = 1;\n}\n\nmessage CMSAlias {\n  string collectionId = 1;\n  string itemId = 2;\n  string fieldId = 3;\n  VariableDataType type = 4;\n}\n\nmessage JsRuntimeAlias {\n  string lookupKey = 1;\n}\n\nmessage PropRefValue {\n  GUID defId = 1;\n}\n\nmessage ManagedStringId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage ManagedStringPlaceholderMapEntry {\n  string key = 1;\n  string value = 2;\n}\n\nmessage SlotContentId {\n  GUID guid = 1;\n}\n\nmessage ManagedStringAlias {\n  ManagedStringId managedStringId = 1;\n  ManagedStringPlaceholderMapEntry[] placeholderValues = 2;\n}\n\nmessage KeyframeTrackId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage AnimationPresetId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage ToolId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage CustomEffectId {\n  GUID guid = 1;\n  AssetRef assetRef = 2;\n}\n\nmessage TRSSTransform2D {\n  Vector translation = 1;\n  float rotation = 2;\n  Vector scale = 3;\n  float shearX = 4;\n}\n\nmessage VariableData {\n  VariableAnyValue value = 1;\n  VariableDataType dataType = 2;\n  VariableResolvedDataType resolvedDataType = 3;\n}\n\nmessage VariableSetMode {\n  GUID id = 1;\n  string name = 2;\n  string sortPosition = 3;\n  VariableSetID parentVariableSetId = 4;\n  GUID parentModeId = 5;\n}\n\nmessage VariableDataValues {\n  VariableDataValuesEntry[] entries = 1;\n}\n\nmessage VariableDataValuesEntry {\n  GUID modeID = 1;\n  VariableData variableData = 2;\n}\n\nenum VariableScope {\n  ALL_SCOPES = 0;\n  TEXT_CONTENT = 1;\n  CORNER_RADIUS = 2;\n  WIDTH_HEIGHT = 3;\n  GAP = 4;\n  ALL_FILLS = 5;\n  FRAME_FILL = 6;\n  SHAPE_FILL = 7;\n  TEXT_FILL = 8;\n  STROKE = 9;\n  STROKE_FLOAT = 10;\n  EFFECT_FLOAT = 11;\n  EFFECT_COLOR = 12;\n  OPACITY = 13;\n  FONT_STYLE = 14;\n  FONT_FAMILY = 15;\n  FONT_SIZE = 16;\n  LINE_HEIGHT = 17;\n  LETTER_SPACING = 18;\n  PARAGRAPH_SPACING = 19;\n  PARAGRAPH_INDENT = 20;\n  FONT_VARIATIONS = 21;\n  TRANSFORM = 22;\n}\n\nmessage KeyframeAnyValue {\n  float floatValue = 1;\n  Color colorValue = 2;\n  TextData textDataValue = 3;\n  Vector vectorValue = 4;\n}\n\nenum KeyframeValueType {\n  FLOAT = 0;\n  INVALID = 1;\n  COLOR = 2;\n  TEXT_DATA = 3;\n  VECTOR = 4;\n}\n\nmessage KeyframeValueData {\n  KeyframeAnyValue value = 1;\n  KeyframeValueType valueType = 2;\n}\n\nenum KeyframeTrackParameterType {\n  INVALID = 0;\n  MANUAL = 1;\n  ANIMATION_PRESET = 2;\n}\n\nmessage ManualKeyframeTrackParameter {\n  KeyframeTrackId keyframeTrackId = 1;\n  GUID timelineDefId = 2;\n}\n\nmessage AnimationPresetKeyframeTrackParameter {\n  AnimationPresetId animationPresetId = 1;\n  KeyframeTrackId keyframeTrackId = 2;\n  GUID timelineDefId = 3;\n}\n\nmessage KeyframeTrackAnyParameter {\n  ManualKeyframeTrackParameter manual = 1;\n  AnimationPresetKeyframeTrackParameter animationPreset = 2;\n  GUID animationStyleBindingId = 3;\n}\n\nmessage KeyframeTrackParameter {\n  KeyframeTrackAnyParameter value = 1;\n  KeyframeTrackParameterType type = 2;\n}\n\nmessage KeyframeTrackParameterValue {\n  KeyframeTrackParameter[] parameters = 1;\n}\n\nmessage AnimationPresets {\n  AnimationPresetData[] presets = 1;\n}\n\nmessage AnimationPresetData {\n  AnimationPresetId animationPresetId = 1;\n  GUID timelineDefId = 2;\n}\n\nmessage StyleAnimation {\n  AnimationPresetId animationPresetId = 1;\n}\n\nmessage StyleIdForAnimation {\n  GUID id = 1;\n  GUID timelineDefId = 2;\n  StyleId animationStyleId = 3;\n  int64 timelineOffset = 4;\n}\n\nmessage Tools {\n  ToolData[] tools = 1;\n}\n\nmessage ToolData {\n  ToolId toolId = 1;\n  CodeComponentId backingCodeComponentId = 2;\n  ComponentPropAssignment[] componentPropAssignments = 3;\n}\n\nmessage CustomEffects {\n  CustomEffectData[] customEffects = 1;\n}\n\nmessage CustomEffectData {\n  CustomEffectId customEffectId = 1;\n}\n\nmessage SpringParams {\n  float stiffness = 1;\n  float damping = 2;\n  float mass = 3;\n}\n\nmessage TransitionEasingAnyValue {\n  SpringParams springEasing = 1;\n  BezierHandles bezierEasing = 2;\n}\n\nmessage EasingData {\n  EasingType easingType = 1;\n  TransitionEasingAnyValue easingValue = 2;\n}\n\nmessage TransitionOverride {\n  GUID id = 1;\n  float duration = 2;\n  VariableData durationVar = 3;\n  float delay = 4;\n  VariableData delayVar = 5;\n  EasingData easing = 6;\n  VariableData easingVar = 7;\n  uint64 createdAtMs = 8;\n  GUID[] interactionIDs = 9;\n  bool disabled = 10;\n}\n\nmessage TransitionOverrideData {\n  TransitionOverride[] all = 1;\n  TransitionOverridePropMap propertyOverrides = 2;\n}\n\nenum TransitionOverrideProp {\n  ALL = 0;\n  OPACITY = 1;\n  TRANSLATION = 2;\n  ROTATION = 3;\n  SCALE = 4;\n}\n\nenum TransitionOverrideBindingTopLevelField {\n  MISSING = 0;\n  PARAMETER_CONSUMPTION_MAP = 1;\n  EFFECT_DATA = 2;\n  FILL_PAINT_DATA = 3;\n  STROKE_PAINT_DATA = 4;\n}\n\nmessage TransitionOverrideBindingLocation {\n  TransitionOverrideBindingTopLevelField topLevelField = 1;\n  int parameterFieldValue = 2;\n  int index = 3;\n  int effectParametrizedFieldValue = 4;\n}\n\nenum KeyframeBindingEffectParametrizedField {\n  MISSING = 0;\n  OFFSET_X = 1;\n  OFFSET_Y = 2;\n  RADIUS = 3;\n  SPREAD = 4;\n  COLOR = 5;\n  REFRACTION_RADIUS = 6;\n  SPECULAR_ANGLE = 7;\n  SPECULAR_INTENSITY = 8;\n  CHROMATIC_ABERRATION = 9;\n  SPLAY = 10;\n  REFRACTION_INTENSITY = 11;\n  START_RADIUS = 12;\n  START_OFFSET_X = 13;\n  START_OFFSET_Y = 14;\n  END_OFFSET_X = 15;\n  END_OFFSET_Y = 16;\n  NOISE_SIZE_X = 17;\n  NOISE_SIZE_Y = 18;\n  DENSITY = 19;\n  EFFECT_OPACITY = 20;\n  SECONDARY_COLOR = 21;\n}\n\nmessage NodeContentsKeyframeBindingLocation {\n  TransitionOverrideBindingTopLevelField topLevelField = 1;\n  VariableField parameterFieldValue = 2;\n  int index = 3;\n  KeyframeBindingEffectParametrizedField effectParametrizedFieldValue = 4;\n}\n\nmessage TransitionOverridePropMap {\n  TransitionOverridePropMapEntry[] entries = 1;\n}\n\nmessage TransitionOverridePropMapEntry {\n  TransitionOverrideProp prop = 1;\n  TransitionOverride[] overrides = 2;\n  TransitionOverrideBindingLocation bindingLocation = 3;\n  NodeContentsKeyframeBindingLocation nodeContentsBindingLocation = 4;\n}\n\nenum CodeSyntaxPlatform {\n  WEB = 0;\n  ANDROID = 1;\n  iOS = 2;\n}\n\nmessage OptionalVector {\n  Vector value = 1;\n}\n\nenum HTMLTag {\n  AUTO = 0;\n  ARTICLE = 1;\n  SECTION = 2;\n  NAV = 3;\n  ASIDE = 4;\n  H1 = 5;\n  H2 = 6;\n  H3 = 7;\n  H4 = 8;\n  H5 = 9;\n  H6 = 10;\n  HGROUP = 11;\n  HEADER = 12;\n  FOOTER = 13;\n  ADDRESS = 14;\n  P = 15;\n  HR = 16;\n  PRE = 17;\n  BLOCKQUOTE = 18;\n  OL = 19;\n  UL = 20;\n  MENU = 21;\n  LI = 22;\n  DL = 23;\n  DT = 24;\n  DD = 25;\n  FIGURE = 26;\n  FIGCAPTION = 27;\n  MAIN = 28;\n  DIV = 29;\n  A = 30;\n  EM = 31;\n  STRONG = 32;\n  SMALL = 33;\n  S = 34;\n  CITE = 35;\n  Q = 36;\n  DFN = 37;\n  ABBR = 38;\n  RUBY = 39;\n  RT = 40;\n  RP = 41;\n  DATA = 42;\n  TIME = 43;\n  CODE = 44;\n  VAR = 45;\n  SAMP = 46;\n  KBD = 47;\n  SUB = 48;\n  SUP = 49;\n  I = 50;\n  B = 51;\n  U = 52;\n  MARK = 53;\n  BDI = 54;\n  BDO = 55;\n  SPAN = 56;\n  BR = 57;\n  WBR = 58;\n  PICTURE = 59;\n  SOURCE = 60;\n  IMG = 61;\n  FORM = 62;\n  LABEL = 63;\n  INPUT = 64;\n  BUTTON = 65;\n  SELECT = 66;\n  DATALIST = 67;\n  OPTGROUP = 68;\n  OPTION = 69;\n  TEXTAREA = 70;\n  OUTPUT = 71;\n  PROGRESS = 72;\n  METER = 73;\n  FIELDSET = 74;\n  LEGEND = 75;\n  VIDEO = 76;\n}\n\nenum ARIARole {\n  AUTO = 0;\n  NONE = 52;\n  APPLICATION = 30;\n  BANNER = 67;\n  COMPLEMENTARY = 68;\n  CONTENTINFO = 69;\n  FORM = 70;\n  MAIN = 71;\n  NAVIGATION = 72;\n  REGION = 73;\n  SEARCH = 74;\n  SEPARATOR = 13;\n  ARTICLE = 31;\n  COLUMNHEADER = 35;\n  DEFINITION = 36;\n  DIRECTORY = 38;\n  DOCUMENT = 39;\n  GROUP = 44;\n  HEADING = 45;\n  IMG = 46;\n  LIST = 48;\n  LISTITEM = 49;\n  MATH = 50;\n  NOTE = 53;\n  PRESENTATION = 55;\n  ROW = 56;\n  ROWGROUP = 57;\n  ROWHEADER = 58;\n  TABLE = 62;\n  TOOLBAR = 65;\n  BUTTON = 1;\n  CHECKBOX = 2;\n  GRIDCELL = 3;\n  LINK = 4;\n  MENUITEM = 5;\n  MENUITEMCHECKBOX = 6;\n  MENUITEMRADIO = 7;\n  OPTION = 8;\n  PROGRESSBAR = 9;\n  RADIO = 10;\n  SCROLLBAR = 11;\n  SLIDER = 14;\n  SPINBUTTON = 15;\n  TAB = 17;\n  TABPANEL = 18;\n  TEXTBOX = 19;\n  TREEITEM = 20;\n  COMBOBOX = 21;\n  GRID = 22;\n  LISTBOX = 23;\n  MENU = 24;\n  MENUBAR = 25;\n  RADIOGROUP = 26;\n  TABLIST = 27;\n  TREE = 28;\n  TREEGRID = 29;\n  TOOLTIP = 66;\n  ALERT = 75;\n  LOG = 76;\n  MARQUEE = 77;\n  STATUS = 78;\n  TIMER = 79;\n  ALERTDIALOG = 80;\n  DIALOG = 81;\n  SEARCHBOX = 12;\n  SWITCH = 16;\n  BLOCKQUOTE = 32;\n  CAPTION = 33;\n  CELL = 34;\n  DELETION = 37;\n  EMPHASIS = 40;\n  FEED = 41;\n  FIGURE = 42;\n  GENERIC = 43;\n  INSERTION = 47;\n  METER = 51;\n  PARAGRAPH = 54;\n  STRONG = 59;\n  SUBSCRIPT = 60;\n  SUPERSCRIPT = 61;\n  TERM = 63;\n  TIME = 64;\n  IMAGE = 82;\n  HEADING_1 = 83;\n  HEADING_2 = 84;\n  HEADING_3 = 85;\n  HEADING_4 = 86;\n  HEADING_5 = 87;\n  HEADING_6 = 88;\n  HEADER = 89;\n  FOOTER = 90;\n  SIDEBAR = 91;\n  SECTION = 92;\n  MAINCONTENT = 93;\n  TABLE_CELL = 94;\n  WIDGET = 95;\n}\n\nmessage MigrationStatus {\n  bool dsdCleanup = 1;\n}\n\nmessage NodeFieldMap {\n  NodeFieldMapEntry[] entries = 1;\n}\n\nmessage NodeFieldMapEntry {\n  GUID guid = 1;\n  uint field = 2;\n  uint lastModifiedSequenceNumber = 3;\n}\n\nenum ColorProfile {\n  SRGB = 0;\n  DISPLAY_P3 = 1;\n}\n\nenum DocumentColorProfile {\n  LEGACY = 0;\n  SRGB = 1;\n  DISPLAY_P3 = 2;\n}\n\nenum ChildReadingDirection {\n  NONE = 0;\n  LEFT_TO_RIGHT = 1;\n  RIGHT_TO_LEFT = 2;\n}\n\nmessage ARIAAttributeAnyValue {\n  bool boolValue = 1;\n  string stringValue = 2;\n  float floatValue = 3;\n  int intValue = 4;\n  string[] stringArrayValue = 5;\n}\n\nenum ARIAAttributeDataType {\n  BOOLEAN = 0;\n  STRING = 1;\n  FLOAT = 2;\n  INT = 3;\n  STRING_LIST = 4;\n}\n\nmessage ARIAAttributeData {\n  ARIAAttributeDataType type = 1;\n  ARIAAttributeAnyValue value = 2;\n}\n\nmessage ARIAAttributesMap {\n  ARIAAttributesMapEntry[] entries = 1;\n}\n\nmessage ARIAAttributesMapEntry {\n  string attribute = 1;\n  ARIAAttributeData value = 2;\n}\n\nmessage HandoffStatusMapEntry {\n  GUID guid = 1;\n  SectionStatusInfo handoffStatus = 2;\n}\n\nmessage HandoffStatusMap {\n  HandoffStatusMapEntry[] entries = 1;\n}\n\nmessage EditScopeInfo {\n  EditScopeStack[] editScopeStacks = 1;\n  EditScopeSnapshot[] snapshots = 2;\n}\n\nmessage EditScopeSnapshot {\n  EditScopeStack[] frames = 1;\n  uint[] nodeChangeFieldNumbers = 2;\n}\n\nmessage EditScopeStack {\n  EditScope[] stack = 1;\n}\n\nmessage EditScope {\n  EditScopeType type = 1;\n  string label = 2;\n  EditorType editorType = 3;\n}\n\nenum EditScopeType {\n  INVALID = 0;\n  TEST_SETUP = 1;\n  USER = 2;\n  PLUGIN = 3;\n  SYSTEM = 4;\n  REST_API = 5;\n  ONBOARDING = 6;\n  AUTOSAVE = 7;\n  AI = 8;\n}\n\nenum SectionPresetState {\n  INSERTED = 0;\n  USER_EDITED = 1;\n}\n\nenum EmojiImageSet {\n  APPLE = 0;\n  NOTO = 1;\n}\n\nenum SelectionRegionFocusType {\n  NONE = 0;\n  PRIMARY = 1;\n  SECONDARY = 2;\n}\n\nmessage SectionPresetInfo {\n  uint64 shelfId = 1;\n  uint64 templateId = 2;\n  string templateName = 3;\n  SectionPresetState state = 4;\n}\n\nmessage ClipboardSelectionRegion {\n  GUID parent = 1;\n  GUID[] nodes = 2;\n  Vector enclosingFrameOffset = 3;\n  bool pasteIsPartiallyOutsideEnclosingFrame = 4;\n  SelectionRegionFocusType focusType = 5;\n}\n\nenum FirstDraftKitType {\n  LOCAL = 0;\n  LIBRARY = 1;\n  NONE = 2;\n}\n\nmessage FirstDraftKit {\n  string key = 1;\n  FirstDraftKitType type = 2;\n}\n\nmessage FirstDraftData {\n  string generationId = 1;\n  FirstDraftKit kit = 2;\n}\n\nenum FirstDraftKitElementType {\n  NONE = 0;\n  BUILDING_BLOCK = 1;\n  GROUPED_COMPONENT = 2;\n}\n\nmessage FirstDraftKitElementData {\n  FirstDraftKitElementType type = 1;\n}\n\nenum PlatformShapeProperty {\n  FILL = 0;\n  STROKE = 1;\n  TEXT = 2;\n  STROKE_COLOR = 3;\n}\n\nenum PlatformShapeBehaviorType {\n  SHAPE = 0;\n  CONTAINER = 1;\n  ADVANCED_CONTAINER = 2;\n}\n\nmessage PlatformShapePropertyMapEntry {\n  PlatformShapeProperty property = 1;\n  GUIDPath[] nodePaths = 2;\n}\n\nmessage PlatformShapeDefinition {\n  PlatformShapePropertyMapEntry[] propertyMapEntries = 1;\n  PlatformShapeBehaviorType behaviorType = 2;\n  GUIDPath thumbnailNode = 3;\n}\n\nmessage NodeBehaviors {\n  LinkBehavior link = 1;\n  AppearBehavior appear = 2;\n  HoverBehavior hover = 3;\n  PressBehavior press = 4;\n  FocusBehavior focus = 5;\n  ScrollParallaxBehavior scrollParallax = 6;\n  ScrollTransformBehavior scrollTransform = 7;\n  CursorBehavior cursor = 8;\n  MarqueeBehavior marquee = 9;\n  CodeBehavior[] code = 10;\n}\n\nmessage BehaviorTransition {\n  EasingType easingType = 1;\n  float[] easingFunction = 2;\n  float transitionDuration = 3;\n  float delay = 4;\n  VariableData transitionDurationVar = 5;\n  VariableData delayVar = 6;\n}\n\nenum AppearBehaviorTrigger {\n  PAGE_LOAD = 1;\n  THIS_LAYER_IN_VIEW = 2;\n  OTHER_LAYER_IN_VIEW = 3;\n  SCROLL_DIRECTION = 4;\n}\n\nenum RelativeDirection {\n  UP = 1;\n  DOWN = 2;\n  LEFT = 3;\n  RIGHT = 4;\n}\n\nmessage AppearBehavior {\n  AppearBehaviorTrigger trigger = 1;\n  RelativeDirection direction = 2;\n  GUID otherLayer = 3;\n  BehaviorTransition enterTransition = 4;\n  NodeChange enterState = 5;\n  BehaviorTransition exitTransition = 6;\n  NodeChange exitState = 7;\n  bool playsOnce = 8;\n  VariableData playsOnceVar = 9;\n  bool isDeleted = 10;\n}\n\nmessage HoverBehavior {\n  BehaviorTransition transition = 1;\n  NodeChange state = 2;\n  bool isDeleted = 3;\n}\n\nmessage PressBehavior {\n  BehaviorTransition transition = 1;\n  NodeChange state = 2;\n  bool isDeleted = 3;\n}\n\nmessage FocusBehavior {\n  BehaviorTransition transition = 1;\n  NodeChange state = 2;\n  bool isDeleted = 3;\n}\n\nmessage ScrollParallaxBehavior {\n  ScrollDirection axis = 1;\n  float speed = 2;\n  bool relativeToPage = 3;\n  VariableData speedVar = 4;\n  bool isDeleted = 5;\n}\n\nenum ScrollTransformBehaviorTrigger {\n  PAGE_HEIGHT = 1;\n  THIS_LAYER_IN_VIEW = 2;\n  OTHER_LAYER_IN_VIEW = 3;\n}\n\nmessage ScrollTransformBehavior {\n  ScrollTransformBehaviorTrigger trigger = 1;\n  GUID otherLayer = 2;\n  BehaviorTransition transition = 3;\n  NodeChange fromState = 4;\n  NodeChange toState = 5;\n  bool playsOnce = 6;\n  bool playsOnceVar = 7;\n  VariableData playsOnceVar2 = 8;\n  bool isDeleted = 9;\n}\n\nmessage CursorBehavior {\n  float hotspotX = 1;\n  float hotspotY = 2;\n  GUID cursorGuid = 3;\n  bool isDeleted = 4;\n}\n\nmessage MarqueeBehavior {\n  RelativeDirection direction = 1;\n  float speed = 2;\n  bool shouldLoopInfinitely = 3;\n  VariableData speedVar = 4;\n  VariableData shouldLoopInfinitelyVar = 5;\n  VariableData pauseOnHover = 6;\n  bool isDeleted = 7;\n}\n\nmessage CodeBehavior {\n  CodeComponentId codeComponentId = 1;\n  ComponentPropAssignment[] componentPropAssignments = 2;\n  bool isDeleted = 3;\n}\n\nmessage ClientRenderedMetadata {\n  string loadID = 1;\n  string trackingSessionId = 2;\n  uint trackingSessionSequenceId = 3;\n  string reconnectID = 4;\n}\n\nenum LinkBehaviorType {\n  URL = 1;\n  PAGE = 2;\n}\n\nmessage LinkBehavior {\n  LinkBehaviorType type = 1;\n  string url = 2;\n  GUID page = 3;\n  bool openInNewWindow = 4;\n}\n\nmessage VariableIdOrVariableOverrideId {\n  VariableID variableId = 1;\n  VariableOverrideId variableOverrideId = 2;\n}\n\nstruct IndexFontVariationAxis {\n  string tag;\n  string name;\n  float min;\n  float max;\n  float defaultValue;\n}\n\nstruct IndexFontVariationAxisValue {\n  string tag;\n  float value;\n}\n\nmessage IndexFontStyle {\n  string name = 1;\n  string postscript = 2;\n  float weight = 3;\n  bool italic = 4;\n  float stretch = 5;\n  IndexFontVariationAxisValue[] variationAxisValues = 6;\n}\n\nmessage IndexFontFile {\n  string filename = 1;\n  uint version = 2;\n  string family = 3;\n  IndexFontStyle[] styles = 4;\n  IndexFontVariationAxis[] variationAxes = 5;\n  bool useFontOpticalSize = 6;\n}\n\nstruct IndexFamilyRename {\n  string oldFamily;\n  string newFamily;\n}\n\nstruct IndexStyleRename {\n  string oldStyle;\n  string newStyle;\n}\n\nstruct IndexFamilyStylesRename {\n  string familyName;\n  IndexStyleRename[] styleRenames;\n}\n\nstruct IndexRenames {\n  IndexFamilyRename[] family;\n  IndexFamilyStylesRename[] style;\n}\n\nstruct IndexEmojiSequence {\n  uint[] codepoints;\n}\n\nstruct IndexEmojis {\n  uint revision;\n  uint[] sizes;\n  IndexEmojiSequence[] sequences;\n}\n\nmessage FontIndex {\n  uint schemaVersion = 1;\n  IndexFontFile[] files = 2;\n  IndexRenames renames = 3;\n  IndexEmojis emojis = 4;\n}\n\nmessage SlideThemeData {\n  ThemeID themeID = 1;\n  string version = 2;\n}\n\nenum SlideNumber {\n  NONE = 0;\n  SLIDE = 1;\n  SECTION = 2;\n  SUBSECTION = 3;\n  TOTAL_WITHIN_DECK = 4;\n  TOTAL_WITHIN_SECTION = 5;\n}\n\nenum NodeChatMessageType {\n  USER_MESSAGE = 0;\n  ASSISTANT_MESSAGE = 1;\n  TOOL_MESSAGE = 2;\n  SYSTEM_MESSAGE = 3;\n}\n\nmessage NodeChatMessage {\n  GUID id = 1;\n  NodeChatMessageType type = 2;\n  string userId = 3;\n  string textContent = 4;\n  uint sentAt = 5;\n  NodeChatToolCall[] toolCalls = 6;\n  NodeChatToolResult[] toolResults = 7;\n  uint64 sentAt64 = 8;\n}\n\nmessage NodeChatToolCall {\n  string toolCallId = 1;\n  string toolName = 2;\n  string argsJson = 3;\n}\n\nmessage NodeChatToolResult {\n  string toolCallId = 1;\n  string toolName = 2;\n  string resultJson = 3;\n}\n\nmessage NodeChatExchange {\n  GUID node = 1;\n  NodeChatMessage[] messages = 2;\n  bool isTyping = 3;\n  FileUpdate[] fileUpdates = 4;\n}\n\nmessage NodeChatCompressionState {\n  uint startIndex = 1;\n  string summary = 2;\n}\n\nmessage FileUpdate {\n  string name = 1;\n  string contents = 2;\n  bool isDeleted = 3;\n}\n\nmessage AIChatContentPart {\n  AIChatContentPartType type = 1;\n  AIChatContentPartAnyValue value = 2;\n}\n\nenum AIChatContentPartType {\n  INVALID = 0;\n  TEXT = 1;\n  SELECTED_NODE_IDS = 2;\n}\n\nmessage AIChatContentPartAnyValue {\n  string textValue = 1;\n  string[] selectedNodeIds = 2;\n}\n\nenum AIChatMessageRole {\n  USER = 0;\n  ASSISTANT = 1;\n  TOOL = 2;\n  SYSTEM = 3;\n}\n\nmessage AIChatMessage {\n  uint createdAtMs = 1;\n  AIChatMessageRole role = 2;\n  AIChatContentPart[] content = 3;\n  string clientId = 4;\n  uint64 createdAtMs64 = 5;\n}\n\nmessage AIChatThread {\n  AIChatMessage[] messages = 1;\n}\n\nenum CooperTemplateType {\n  CUSTOM = 0;\n  TWITTER_POST = 1;\n  LINKEDIN_POST = 2;\n  INSTA_POST_SQUARE = 3;\n  INSTA_POST_PORTRAIT = 4;\n  INSTA_STORY = 5;\n  INSTA_AD = 6;\n  FACEBOOK_POST = 7;\n  FACEBOOK_COVER_PHOTO = 8;\n  FACEBOOK_EVENT_COVER = 9;\n  FACEBOOK_AD_PORTRAIT = 10;\n  FACEBOOK_AD_SQUARE = 11;\n  PINTEREST_AD_PIN = 12;\n  TWITTER_BANNER = 13;\n  LINKEDIN_POST_SQUARE = 15;\n  LINKEDIN_POST_PORTRAIT = 16;\n  LINKEDIN_POST_LANDSCAPE = 17;\n  LINKEDIN_PROFILE_BANNER = 18;\n  LINKEDIN_ARTICLE_BANNER = 19;\n  LINKEDIN_AD_LANDSCAPE = 20;\n  LINKEDIN_AD_SQUARE = 21;\n  LINKEDIN_AD_VERTICAL = 22;\n  YOUTUBE_THUMBNAIL = 23;\n  YOUTUBE_BANNER = 24;\n  YOUTUBE_AD = 25;\n  TWITCH_BANNER = 26;\n  GOOGLE_LEADERBOARD_AD = 27;\n  GOOGLE_LARGE_AD = 28;\n  GOOGLE_MED_AD = 29;\n  GOOGLE_MOBILE_BANNER_AD = 30;\n  GOOGLE_SKYSCRAPER_AD = 31;\n  CARD_HORIZONTAL = 32;\n  CARD_VERTICAL = 33;\n  PRINT_US_LETTER = 34;\n  POSTER = 35;\n  BANNER_STANDARD = 36;\n  BANNER_WIDE = 37;\n  BANNER_ULTRAWIDE = 38;\n  NAME_TAG_PORTRAIT = 39;\n  NAME_TAG_LANDSCAPE = 40;\n  INSTA_REEL_COVER = 41;\n  ZOOM_BACKGROUND = 42;\n  TIKTOK_POST = 43;\n  INSTA_AD_PORTRAIT = 44;\n  INSTA_POST_TALL_PORTRAIT = 45;\n  TWITTER_POST_SQUARE = 46;\n  FACEBOOK_POST_SQUARE = 47;\n  FACEBOOK_POST_PORTRAIT = 48;\n  FACEBOOK_STORY = 49;\n  GOOGLE_SQUARE_AD = 50;\n  GOOGLE_SMALL_SQUARE_AD = 51;\n  GOOGLE_NARROW_SKYSCRAPER_AD = 52;\n  GOOGLE_HALF_PAGE_AD = 53;\n  GOOGLE_LARGE_LEADERBOARD_AD = 54;\n  GOOGLE_BILLBOARD_AD = 55;\n  GOOGLE_BANNER_LEADERBOARD_AD = 56;\n  GOOGLE_TOP_BANNER_AD = 57;\n  GOOGLE_MOBILE_LEADERBOARD_BANNER_AD = 58;\n  GOOGLE_LARGE_MOBILE_BANNER_AD = 59;\n  GOOGLE_MOBILE_INTERSTITIAL_AD = 60;\n  GOOGLE_MOBILE_MED_RECTANGLE_AD = 61;\n  PINTEREST_PIN_STANDARD = 62;\n  PINTEREST_PIN_SQUARE = 63;\n  PINTEREST_AD_SQUARE = 64;\n  PRINT_A4 = 65;\n}\n\nmessage CooperTemplateData {\n  CooperTemplateType type = 1;\n}\n\nmessage ImageImportMap {\n  ImageImport[] imports = 1;\n}\n\nmessage ImageImport {\n  string name = 1;\n  Image image = 2;\n}\n\nenum InterpolationType {\n  HOLD = 0;\n  BEZIER = 1;\n  SPRING = 2;\n}\n\nmessage BezierHandles {\n  float p1x = 1;\n  float p1y = 2;\n  float p2x = 3;\n  float p2y = 4;\n}\n\nenum KeyframeOperation {\n  SET = 0;\n  SCALE = 1;\n  OFFSET = 2;\n}\n\nenum TimelinePositionType {\n  ABSOLUTE = 0;\n  RELATIVE = 1;\n}\n\nenum PlaybackStyle {\n  ONCE = 0;\n  LOOP = 1;\n  BOOMERANG = 2;\n}\n");
validateSchema(schema);
//#endregion
//#region src/fig/protocol.ts
/**
* Figma Multiplayer Protocol
*
* This module handles the low-level WebSocket communication with Figma's
* multiplayer server. The protocol uses:
*
* - Kiwi binary serialization (schema-based, like Protocol Buffers)
* - Zstd compression for all messages
* - Session-based authentication via cookies
*
* Message types (from Figma's schema):
*   0 = JOIN_START     - Server sends session info
*   1 = NODE_CHANGES   - Create/update/delete nodes
*   2 = USER_CHANGES   - User presence updates
*   3 = JOIN_END       - Initial sync complete
*   4 = SIGNAL         - Various metadata (reconnect info, etc.)
*   5 = STYLE          - Style updates
*   ...and more
*
* Wire format:
*   All messages are Zstd-compressed Kiwi-encoded binary data.
*   Zstd magic bytes: 0x28 0xB5 0x2F 0xFD
*/
const MESSAGE_TYPES = {
	JOIN_START: 0,
	NODE_CHANGES: 1,
	USER_CHANGES: 2,
	JOIN_END: 3,
	SIGNAL: 4,
	STYLE: 5,
	STYLE_SET: 6,
	JOIN_START_SKIP_RELOAD: 7,
	NOTIFY_SHOULD_UPGRADE: 8,
	UPGRADE_DONE: 9,
	UPGRADE_REFRESH: 10,
	SCENE_GRAPH_QUERY: 11,
	SCENE_GRAPH_REPLY: 12,
	DIFF: 13,
	CLIENT_BROADCAST: 14
};
const NODE_TYPES = {
	NONE: 0,
	DOCUMENT: 1,
	CANVAS: 2,
	GROUP: 3,
	FRAME: 4,
	BOOLEAN_OPERATION: 5,
	VECTOR: 6,
	STAR: 7,
	LINE: 8,
	ELLIPSE: 9,
	RECTANGLE: 10,
	REGULAR_POLYGON: 11,
	ROUNDED_RECTANGLE: 12,
	TEXT: 13,
	SLICE: 14,
	SYMBOL: 15,
	INSTANCE: 16,
	STICKY: 17,
	SHAPE_WITH_TEXT: 18,
	CONNECTOR: 19,
	CODE_BLOCK: 20,
	WIDGET: 21,
	STAMP: 22,
	MEDIA: 23,
	HIGHLIGHT: 24,
	SECTION: 25,
	SECTION_OVERLAY: 26,
	WASHI_TAPE: 27,
	VARIABLE: 28
};
const NODE_PHASES = {
	CREATED: 0,
	REMOVED: 1
};
const BLEND_MODES = {
	PASS_THROUGH: 0,
	NORMAL: 1,
	DARKEN: 2,
	MULTIPLY: 3,
	LINEAR_BURN: 4,
	COLOR_BURN: 5,
	LIGHTEN: 6,
	SCREEN: 7,
	LINEAR_DODGE: 8,
	COLOR_DODGE: 9,
	OVERLAY: 10,
	SOFT_LIGHT: 11,
	HARD_LIGHT: 12,
	DIFFERENCE: 13,
	EXCLUSION: 14,
	HUE: 15,
	SATURATION: 16,
	COLOR: 17,
	LUMINOSITY: 18
};
const PAINT_TYPES = {
	SOLID: 0,
	GRADIENT_LINEAR: 1,
	GRADIENT_RADIAL: 2,
	GRADIENT_ANGULAR: 3,
	GRADIENT_DIAMOND: 4,
	IMAGE: 5,
	EMOJI: 6,
	VIDEO: 7
};
/**
* Zstd magic bytes
*/
const ZSTD_MAGIC = new Uint8Array([
	40,
	181,
	47,
	253
]);
/**
* Kiwi uses field numbers to identify message fields.
* Field 1 with value = message type indicates the message kind.
*/
const KIWI = {
	/** First byte of valid Kiwi messages (field number 1) */
	MESSAGE_MARKER: 1,
	/** Field number for sessionID in JOIN_START message */
	SESSION_ID_FIELD: 2,
	/** Varint continuation bit (MSB set = more bytes follow) */
	VARINT_CONTINUE_BIT: 128,
	/** Varint value mask (lower 7 bits contain data) */
	VARINT_VALUE_MASK: 127,
	/** Bits per varint byte */
	VARINT_BITS_PER_BYTE: 7
};
/**
* Valid session ID range (based on observed Figma behavior)
*/
const SESSION_ID = {
	MIN: 1e4,
	MAX: 1e6
};
/**
* Parse a varint from a Uint8Array at given position
* Returns [value, newPosition]
*/
function parseVarint(data, pos) {
	let value = 0;
	let shift = 0;
	while (pos < data.length) {
		const byte = data[pos];
		pos++;
		value |= (byte & KIWI.VARINT_VALUE_MASK) << shift;
		if (!(byte & KIWI.VARINT_CONTINUE_BIT)) break;
		shift += KIWI.VARINT_BITS_PER_BYTE;
	}
	return [value, pos];
}
/**
* Check if data is a valid Kiwi message
*/
function isKiwiMessage(data) {
	return data.length >= 2 && data[0] === KIWI.MESSAGE_MARKER;
}
/**
* Get message type from Kiwi message
*/
function getKiwiMessageType(data) {
	if (!isKiwiMessage(data)) return null;
	return data[1] ?? null;
}
/**
* fig-wire header magic (first 8 bytes of some messages)
*/
const FIG_WIRE_MAGIC = "fig-wire";
/**
* Check if data is Zstd-compressed
*/
function isZstdCompressed(data) {
	return data.length >= 4 && data[0] === 40 && data[1] === 181 && data[2] === 47 && data[3] === 253;
}
/**
* Check if data has fig-wire header
*/
function hasFigWireHeader(data) {
	if (data.length < 8) return false;
	return new TextDecoder().decode(data.slice(0, 8)) === FIG_WIRE_MAGIC;
}
/**
* Skip fig-wire header and find zstd data
* Header format: "fig-wire" (8 bytes) + version (4 bytes LE) + zstd data
*/
function skipFigWireHeader(data) {
	if (!hasFigWireHeader(data)) return data;
	return data.slice(12);
}
/**
* Current multiplayer protocol version
*/
const PROTOCOL_VERSION = 151;
/**
* Build WebSocket URL for Figma multiplayer
*/
function buildMultiplayerURL(fileKey, trackingId) {
	return `wss://www.figma.com/api/multiplayer/${fileKey}?${new URLSearchParams({
		role: "editor",
		version: String(151),
		recentReload: "0",
		tracking_session_id: trackingId || `ws-${Date.now()}`
	})}`;
}
//#endregion
//#region src/fig/variable-bindings.ts
function encodeVarint(value) {
	const bytes = [];
	while (value > 127) {
		bytes.push(value & 127 | 128);
		value >>>= 7;
	}
	bytes.push(value);
	return bytes;
}
function encodePaintWithVariableBinding$1(codec, paint, variableSessionID, variableLocalID) {
	const { colorVariableBinding: _, ...basePaint } = paint;
	const baseBytes = codec.encodePaint(basePaint);
	const baseArray = Array.from(baseBytes);
	if (baseArray[baseArray.length - 1] === 0) baseArray.pop();
	baseArray.push(21, 1);
	baseArray.push(4, 1);
	baseArray.push(...encodeVarint(variableSessionID));
	baseArray.push(...encodeVarint(variableLocalID));
	baseArray.push(0, 0, 2, 3, 3, 4);
	baseArray.push(0, 0);
	return new Uint8Array(baseArray);
}
function parseVariableId(variableId) {
	const match = variableId.match(/VariableID:(\d+):(\d+)/);
	if (!match) return null;
	return {
		sessionID: Number.parseInt(match[1] ?? "0", 10),
		localID: Number.parseInt(match[2] ?? "0", 10)
	};
}
function encodeNodeChangeWithVariables$1(codec, nodeChange) {
	const hasFillBinding = nodeChange.fillPaints?.some((paint) => paint.colorVariableBinding);
	const hasStrokeBinding = nodeChange.strokePaints?.some((paint) => paint.colorVariableBinding);
	if (!hasFillBinding && !hasStrokeBinding) return codec.encodeNodeChange(nodeChange);
	const cleanNodeChange = { ...nodeChange };
	if (cleanNodeChange.fillPaints) cleanNodeChange.fillPaints = cleanNodeChange.fillPaints.map(({ colorVariableBinding: _, ...rest }) => rest);
	if (cleanNodeChange.strokePaints) cleanNodeChange.strokePaints = cleanNodeChange.strokePaints.map(({ colorVariableBinding: _, ...rest }) => rest);
	const baseBytes = codec.encodeNodeChange(cleanNodeChange);
	let hex = Buffer.from(baseBytes).toString("hex");
	const fillBinding = nodeChange.fillPaints?.[0]?.colorVariableBinding;
	if (hasFillBinding && fillBinding) hex = injectVariableBinding(hex, "2601", fillBinding);
	const strokeBinding = nodeChange.strokePaints?.[0]?.colorVariableBinding;
	if (hasStrokeBinding && strokeBinding) hex = injectVariableBinding(hex, "2701", strokeBinding);
	return hexToBytes$1(hex);
}
function injectVariableBinding(hex, marker, binding) {
	const markerIdx = hex.indexOf(marker);
	if (markerIdx === -1) return hex;
	const patternIdx = hex.indexOf("0401", markerIdx);
	if (patternIdx === -1) return hex;
	let insertPoint = patternIdx + 4;
	if (hex.slice(insertPoint, insertPoint + 4) === "0501") insertPoint += 4;
	const varBytes = [
		21,
		1,
		4,
		1,
		...encodeVarint(binding.variableID.sessionID),
		...encodeVarint(binding.variableID.localID),
		0,
		0,
		2,
		3,
		3,
		4,
		0,
		0
	];
	const varHex = Buffer.from(varBytes).toString("hex");
	const beforeVar = hex.slice(0, insertPoint);
	let afterIdx = insertPoint;
	if (hex.slice(afterIdx, afterIdx + 2) === "00") afterIdx += 2;
	const afterVar = hex.slice(afterIdx);
	return beforeVar + varHex + afterVar;
}
function hexToBytes$1(hex) {
	if (hex.length % 2 !== 0) throw new Error("Hex string must have an even length");
	const bytes = new Uint8Array(hex.length / 2);
	for (let index = 0; index < bytes.length; index++) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	return bytes;
}
//#endregion
//#region src/fig/codec.ts
/**
* Message Encoding/Decoding for Figma Multiplayer
*
* Uses:
* - kiwi-schema: Binary serialization (by Evan Wallace, Figma co-founder)
* - fzstd: Browser-compatible Zstd decompression
*/
let compiledSchema = null;
function bytesToHex(bytes) {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
	return new Uint8Array(hex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}
/**
* Initialize the codec (compiles Kiwi schema)
*/
async function initCodec() {
	if (compiledSchema) return;
	compiledSchema = compileSchema(schema);
}
function getCompiledSchema() {
	if (!compiledSchema) throw new Error("Codec not initialized");
	return compiledSchema;
}
function getSchemaBytes() {
	return encodeBinarySchema(schema);
}
/**
* Check if codec is initialized
*/
function isCodecReady() {
	return compiledSchema !== null;
}
/**
* Compress data using Zstd (Bun native)
*/
function compress(data) {
	return data;
}
/**
* Decompress Zstd data (Bun native)
*/
function decompress$1(data) {
	if (!isZstdCompressed(data)) return data;
	return decompress(data);
}
/**
* Encode a message for sending to Figma
* Handles variable bindings in fillPaints which require custom encoding
*/
function encodeMessage(message) {
	if (!compiledSchema) throw new Error("Codec not initialized. Call initCodec() first.");
	if (!message.nodeChanges?.some((nc) => nc.fillPaints?.some((p) => p.colorVariableBinding) || nc.strokePaints?.some((p) => p.colorVariableBinding))) return compress(compiledSchema.encodeMessage(message));
	const messageWithoutNodes = {
		...message,
		nodeChanges: []
	};
	const baseHex = bytesToHex(compiledSchema.encodeMessage(messageWithoutNodes));
	const nodeChangeBytes = [];
	for (const nc of message.nodeChanges || []) {
		const encoded = encodeNodeChangeWithVariables(nc);
		nodeChangeBytes.push(encoded);
	}
	const emptyArrayIdx = baseHex.indexOf("0400");
	if (emptyArrayIdx === -1) return compress(compiledSchema.encodeMessage(message));
	const ncBytes = [4];
	ncBytes.push(...encodeVarint(nodeChangeBytes.length));
	for (const ncArr of nodeChangeBytes) ncBytes.push(...Array.from(ncArr));
	const beforeArray = baseHex.slice(0, emptyArrayIdx);
	const afterArray = baseHex.slice(emptyArrayIdx + 4);
	return compress(hexToBytes(beforeArray + bytesToHex(ncBytes) + afterArray));
}
/**
* Decode a message received from Figma
*/
function decodeMessage(data) {
	if (!compiledSchema) throw new Error("Codec not initialized. Call initCodec() first.");
	const decompressed = decompress$1(data);
	return compiledSchema.decodeMessage(decompressed);
}
/**
* Quick peek at message type without full decoding
*/
function peekMessageType(data) {
	try {
		return getKiwiMessageType(decompress$1(data));
	} catch {
		return null;
	}
}
/**
* Create a NODE_CHANGES message
*/
function createNodeChangesMessage(sessionID, reconnectSequenceNumber, nodeChanges, ackID = 1) {
	return {
		type: "NODE_CHANGES",
		sessionID,
		ackID,
		reconnectSequenceNumber,
		nodeChanges
	};
}
/**
* Create a node change for a new shape
*/
function createNodeChange(opts) {
	const change = {
		guid: {
			sessionID: opts.sessionID,
			localID: opts.localID
		},
		phase: "CREATED",
		parentIndex: {
			guid: {
				sessionID: opts.parentSessionID,
				localID: opts.parentLocalID
			},
			position: opts.position || "!"
		},
		type: opts.type,
		name: opts.name,
		visible: true,
		opacity: opts.opacity ?? 1,
		size: {
			x: opts.width,
			y: opts.height
		},
		transform: {
			m00: 1,
			m01: 0,
			m02: opts.x,
			m10: 0,
			m11: 1,
			m12: opts.y
		}
	};
	if (opts.fill) change.fillPaints = [{
		type: "SOLID",
		color: opts.fill,
		opacity: 1,
		visible: true,
		blendMode: "NORMAL"
	}];
	if (opts.stroke) {
		change.strokePaints = [{
			type: "SOLID",
			color: opts.stroke,
			opacity: 1,
			visible: true,
			blendMode: "NORMAL"
		}];
		change.strokeWeight = opts.strokeWeight ?? 1;
	}
	if (opts.cornerRadius !== void 0) change.cornerRadius = opts.cornerRadius;
	return change;
}
/**
* Encode a varint (variable-length integer)
*/
function encodePaintWithVariableBinding(paint, variableSessionID, variableLocalID) {
	if (!compiledSchema) throw new Error("Codec not initialized. Call initCodec() first.");
	return encodePaintWithVariableBinding$1(compiledSchema, paint, variableSessionID, variableLocalID);
}
function encodeNodeChangeWithVariables(nodeChange) {
	if (!compiledSchema) throw new Error("Codec not initialized. Call initCodec() first.");
	return encodeNodeChangeWithVariables$1(compiledSchema, nodeChange);
}
//#endregion
export { BLEND_MODES, ByteBuffer, FIG_WIRE_MAGIC, KIWI, MESSAGE_TYPES, NODE_PHASES, NODE_TYPES, PAINT_TYPES, PROTOCOL_VERSION, SESSION_ID, ZSTD_MAGIC, buildMultiplayerURL, compileSchema, compress, createNodeChange, createNodeChangesMessage, decodeBinarySchema, decodeMessage, decompress$1 as decompress, encodeBinarySchema, encodeMessage, encodeNodeChangeWithVariables, encodeNodeChangeWithVariables$1, encodePaintWithVariableBinding, encodePaintWithVariableBinding$1, encodeVarint, expectEnumValue, expectFieldNumber, findDefinition, findField, getCompiledSchema, getKiwiMessageType, getSchemaBytes, hasFigWireHeader, initCodec, isCodecReady, isKiwiMessage, isZstdCompressed, parseSchema, parseVariableId, parseVarint, peekMessageType, schema, skipFigWireHeader, validateSchema };

//# sourceMappingURL=codec.js.map