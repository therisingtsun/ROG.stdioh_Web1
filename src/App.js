import React, { useState, useRef } from "react";

import "./App.scss";
import Preview from "./Preview";

import "codemirror/mode/markdown/markdown";
import "./theme-dark.css";

import CodeMirror from "./CodeMirror";

export default function App() {
	const [text, setText] = useState(`
# Henlo worldo!
	
**bold**
_italics_
~~strike~~
<div id="idName">;-;</div>

\`\`\`ts
const x = 'lul';
	function (mlep: string) {
return "fook" + mlep;
}
\`\`\`
\`\`\`cpp
	#include <iostream>

int main() {
cout << "Henlo World!";
return 0;
}
\`\`\`
\`\`\`py
import math

print(math.floor(102.111))
\`\`\`

hello world hii
`);
	const data = useRef();
	const changeHandler = (value) => {
		setText(value);
	};

	function wordTransformer(config) {
		const editor = data.current.editor;
		const cursorPosition = editor.listSelections();

		const nullCheck = checkEmptySpaceSelection(editor);

		if (!nullCheck) {
			editor.setSelections(selectEnclosingWords(editor));
		}

		let prevData = editor.getSelections();
		let changedData = editor
			.getSelections()
			.map((text) => config.transform(text));
		editor.replaceSelections(changedData);

		const isFormatted = checkIfFormatted(
			prevData[0].length,
			changedData[0].length
		);
		modifyPostTransformCursorPos(config, isFormatted);

		cursorPlacementForWordTransform(
			editor,
			nullCheck,
			config,
			cursorPosition
		);

		setFocusOnEditor(editor);
	}

	function lineTransformer(config) {
		const editor = data.current.editor;
		const positionOfCursor = editor.getCursor();
		let contentOfLine = editor.getLine(positionOfCursor.line);

		editor.setSelection(
			{
				line: positionOfCursor.line,
				ch: 0,
			},
			{
				line: positionOfCursor.line,
				ch: contentOfLine.length,
			}
		);
		const transformedLine = config.transform(contentOfLine);
		editor.replaceSelection(transformedLine);
		let updatedContentOfLine = editor.getLine(positionOfCursor.line);

		const lengthDifference = getLengthDifference(
			contentOfLine.length,
			updatedContentOfLine.length
		);

		cursorPlacementForLineTransform(
			editor,
			lengthDifference,
			positionOfCursor
		);
		setFocusOnEditor(editor);
	}
	function checkEmptySpaceSelection(editor) {
		const cursorPosition = editor.getCursor();
		const check = editor.findWordAt(cursorPosition);

		let nullCheck;
		if (!editor.somethingSelected()) {
			nullCheck =
				cursorPosition.ch === check.anchor.ch ||
				cursorPosition.ch === check.head.ch;
		}
		return nullCheck;
	}

	function selectEnclosingWords(editor) {
		const listSelections = editor.listSelections();
		let selections = [];
		listSelections.forEach((element) => {
			if (element.anchor.ch === element.head.ch) {
				const pos = editor.findWordAt(element.anchor);
				const getLineOfCursor = editor.getCursor();
				const lineOfCursor = editor.getLine(getLineOfCursor.line);

				let startIndex = pos.anchor.ch;
				let endIndex = pos.head.ch;

				while (startIndex > 0) {
					if (/\s/.test(lineOfCursor[startIndex - 1])) break;
					else startIndex--;
				}

				while (endIndex < lineOfCursor.length) {
					if (/\s/.test(lineOfCursor[endIndex])) break;
					else endIndex++;
				}

				selections.push({
					anchor: {
						ch: startIndex,
						line: pos.anchor.line,
					},
					head: {
						ch: endIndex,
						line: pos.head.line,
					},
				});
			}
			selections.push(element);
		});
		return selections;
	}

	function checkIfFormatted(prevLen, postLen) {
		return prevLen < postLen;
	}

	function modifyPostTransformCursorPos(config, formatted) {
		config.postTransformCursorPos = formatted
			? config.postTransformCursorPos
			: -config.postTransformCursorPos;
	}

	function cursorPlacementForWordTransform(
		editor,
		nullCheck,
		config,
		cursorPosition
	) {
		if (nullCheck) {
			const currentPos = editor.getCursor();

			editor.setCursor(
				currentPos.line,
				currentPos.ch - config.postTransformCursorPos
			);
		} else {
			console.log(cursorPosition);
			let cursorPositions = [];
			cursorPosition.forEach((element) => {
				cursorPositions.push({
					anchor: {
						line: element.anchor.line,
						ch: element.anchor.ch + config.postTransformCursorPos,
					},
					head: {
						line: element.anchor.line,
						ch: element.anchor.ch + config.postTransformCursorPos,
					},
				});
			});
			editor.setSelections(cursorPositions);
		}
	}

	function getLengthDifference(prevLen, postLen) {
		return prevLen - postLen;
	}

	function cursorPlacementForLineTransform(
		editor,
		lengthDifference,
		positionOfCursor
	) {
		editor.setCursor(
			positionOfCursor.line,
			positionOfCursor.ch - lengthDifference
		);
	}

	function setFocusOnEditor(editor) {
		if (!editor.hasFocus()) editor.focus();
	}

	const toggleItalics = {
		transform(text) {
			const italicsRegex = /^_((?:.|\r?\n)*?)_$/;
			return italicsRegex.test(text)
				? text.replace(italicsRegex, "$1")
				: `_${text}_`;
		},
		postTransformCursorPos: 1,
	};

	const toggleBold = {
		transform(text) {
			const boldRegex = /^\*\*((?:.|\r?\n)*?)\*\*$/;
			return boldRegex.test(text)
				? text.replace(boldRegex, "$1")
				: `\*\*${text}\*\*`;
		},
		postTransformCursorPos: 2,
	};

	const toggleStrikethrough = {
		transform(text) {
			const boldRegex = /^~~((?:.|\r?\n)*?)~~$/;
			return boldRegex.test(text)
				? text.replace(boldRegex, "$1")
				: `~~${text}~~`;
		},
		postTransformCursorPos: 2,
	};

	const toggleheading = {
		transform(text) {
			const noHeadingRegex = /^([^#]+)/;
			const headingRegex = /^(#{1,5})\s(.*)/;
			return noHeadingRegex.test(text)
				? `# ${text}`
				: headingRegex.test(text)
				? text.replace(headingRegex, "$1# $2")
				: text;
		},
	};

	const toggleMerit = {
		transform(text) {
			const meritRegex = /^\((\+|-)\)(.*)/;
			const match = meritRegex.exec(text);
			return match
				? match[1] === "+"
					? text.replace(meritRegex, "$2")
					: text.replace(meritRegex, "(+)$2")
				: `(+)${text}`;
		},
	};

	const toggleDemerit = {
		transform(text) {
			const demeritRegex = /^\((\+|-)\)(.*)/;
			const match = demeritRegex.exec(text);
			return match
				? match[1] === "-"
					? text.replace(demeritRegex, "$2")
					: text.replace(demeritRegex, "(-)$2")
				: `(-)${text}`;
		},
	};

	return (
		<div className="App">
			<CodeMirror
				value={text}
				options={{
					mode: "markdown",
					theme: "theme-dark",
					indentUnit: 4,
					indentWithTabs: true,
					tabSize: 4,
					lineWrapping: true,
				}}
				onChange={(value, viewUpdate) => {
					let str = value.getValue();
					changeHandler(str);
				}}
				ref={data}
			/>
			<Preview value={text} />

			<div>
				<button
					onClick={() => {
						wordTransformer(toggleBold);
					}}
				>
					BOLD
				</button>
				<button
					onClick={() => {
						wordTransformer(toggleItalics);
					}}
				>
					ITALIC
				</button>
				<button
					onClick={() => {
						wordTransformer(toggleStrikethrough);
					}}
				>
					STRIKETHROUGH
				</button>
				<button
					onClick={() => {
						lineTransformer(toggleheading);
					}}
				>
					HEADING
				</button>
				<button
					onClick={() => {
						lineTransformer(toggleMerit);
					}}
				>
					MERIT
				</button>
				<button
					onClick={() => {
						lineTransformer(toggleDemerit);
					}}
				>
					DEMERIT
				</button>
			</div>
		</div>
	);
}
