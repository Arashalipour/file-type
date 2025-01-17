/**
Typings for primary entry point, Node.js specific typings can be found in index.d.ts
*/

import type {ReadableStream as WebReadableStream} from 'node:stream/web';
import type {ITokenizer, AnyWebByteStream} from 'strtok3';

/**
Either the Node.js ReadableStream or the `lib.dom.d.ts` ReadableStream.
Related issue: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/60377
*/
export type AnyWebReadableStream<G> = WebReadableStream<G> | ReadableStream<G>;

export type FileTypeResult = {
	/**
	One of the supported [file types](https://github.com/sindresorhus/file-type#supported-file-types).
	*/
	readonly ext: string;

	/**
	The detected [MIME type](https://en.wikipedia.org/wiki/Internet_media_type).
	*/
	readonly mime: string;
};

/**
Detect the file type of a `Uint8Array`, or `ArrayBuffer`.

The file type is detected by checking the [magic number](https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files) of the buffer.

If file access is available, it is recommended to use `.fromFile()` instead.

@param buffer - An Uint8Array or ArrayBuffer representing file data. It works best if the buffer contains the entire file. It may work with a smaller portion as well.
@returns The detected file type, or `undefined` when there is no match.
*/
export function fileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer): Promise<FileTypeResult | undefined>;

/**
Detect the file type of a [web `ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream).

The file type is detected by checking the [magic number](https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files) of the buffer.

@param stream - A [web `ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) streaming a file to examine.
@returns A `Promise` for an object with the detected file type, or `undefined` when there is no match.
*/
export function fileTypeFromStream(stream: AnyWebByteStream): Promise<FileTypeResult | undefined>;

/**
Detect the file type from an [`ITokenizer`](https://github.com/Borewit/strtok3#tokenizer) source.

This method is used internally, but can also be used for a special "tokenizer" reader.

A tokenizer propagates the internal read functions, allowing alternative transport mechanisms, to access files, to be implemented and used.

@param tokenizer - File source implementing the tokenizer interface.
@returns The detected file type, or `undefined` when there is no match.

An example is [`@tokenizer/http`](https://github.com/Borewit/tokenizer-http), which requests data using [HTTP-range-requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests). A difference with a conventional stream and the [*tokenizer*](https://github.com/Borewit/strtok3#tokenizer), is that it is able to *ignore* (seek, fast-forward) in the stream. For example, you may only need and read the first 6 bytes, and the last 128 bytes, which may be an advantage in case reading the entire file would take longer.

@example
```
import {makeTokenizer} from '@tokenizer/http';
import {fileTypeFromTokenizer} from 'file-type';

const audioTrackUrl = 'https://test-audio.netlify.com/Various%20Artists%20-%202009%20-%20netBloc%20Vol%2024_%20tiuqottigeloot%20%5BMP3-V2%5D/01%20-%20Diablo%20Swing%20Orchestra%20-%20Heroines.mp3';

const httpTokenizer = await makeTokenizer(audioTrackUrl);
const fileType = await fileTypeFromTokenizer(httpTokenizer);

console.log(fileType);
//=> {ext: 'mp3', mime: 'audio/mpeg'}
```
*/
export function fileTypeFromTokenizer(tokenizer: ITokenizer): Promise<FileTypeResult | undefined>;

/**
Supported file extensions.
*/
export const supportedExtensions: ReadonlySet<string>;

/**
Supported MIME types.
*/
export const supportedMimeTypes: ReadonlySet<string>;

export type StreamOptions = {
	/**
	The default sample size in bytes.

	@default 4100
	*/
	readonly sampleSize?: number;
};

/**
Detect the file type of a [`Blob`](https://nodejs.org/api/buffer.html#class-blob) or [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File).

@param blob - The [`Blob`](https://nodejs.org/api/buffer.html#class-blob) used for file detection.
@returns The detected file type, or `undefined` when there is no match.

@example
```
import {fileTypeFromBlob} from 'file-type';

const blob = new Blob(['<?xml version="1.0" encoding="ISO-8859-1" ?>'], {
	type: 'text/plain',
	endings: 'native'
});

console.log(await fileTypeFromBlob(blob));
//=> {ext: 'txt', mime: 'text/plain'}
```
*/
export declare function fileTypeFromBlob(blob: Blob): Promise<FileTypeResult | undefined>;

/**
Function that allows specifying custom detection mechanisms.

An iterable of detectors can be provided via the `fileTypeOptions` argument for the {@link FileTypeParser.constructor}.

The detectors are called before the default detections in the provided order.

Custom detectors can be used to add new `FileTypeResults` or to modify return behavior of existing `FileTypeResult` detections.

If the detector returns `undefined`, there are 2 possible scenarios:

1. The detector has not read from the tokenizer, it will be proceeded with the next available detector.
2. The detector has read from the tokenizer (`tokenizer.position` has been increased).
	In that case no further detectors will be executed and the final conclusion is that file-type returns undefined.
	Note that this an exceptional scenario, as the detector takes the opportunity from any other detector to determine the file type.

Example detector array which can be extended and provided via the fileTypeOptions argument:

```
import {FileTypeParser} from 'file-type';

const customDetectors = [
	async tokenizer => {
		const unicornHeader = [85, 78, 73, 67, 79, 82, 78]; // 'UNICORN' as decimal string

		const buffer = Buffer.alloc(7);
		await tokenizer.peekBuffer(buffer, {length: unicornHeader.length, mayBeLess: true});
		if (unicornHeader.every((value, index) => value === buffer[index])) {
			return {ext: 'unicorn', mime: 'application/unicorn'};
		}

		return undefined;
	},
];

const buffer = Buffer.from('UNICORN');
const parser = new FileTypeParser({customDetectors});
const fileType = await parser.fromBuffer(buffer);
console.log(fileType);
```

@param tokenizer - The [tokenizer](https://github.com/Borewit/strtok3#tokenizer) used to read the file content from.
@param fileType - The file type detected by the standard detections or a previous custom detection, or `undefined`` if no matching file type could be found.
@returns The detected file type, or `undefined` when there is no match.
*/
export type Detector = (tokenizer: ITokenizer, fileType?: FileTypeResult) => Promise<FileTypeResult | undefined>;

export type FileTypeOptions = {
	customDetectors?: Iterable<Detector>;
};

export declare class TokenizerPositionError extends Error {
	constructor(message?: string);
}

export type AnyWebReadableByteStreamWithFileType = AnyWebReadableStream<Uint8Array> & {
	readonly fileType?: FileTypeResult;
};

/**
Returns a `Promise` which resolves to the original readable stream argument, but with an added `fileType` property, which is an object like the one returned from `fileTypeFromFile()`.

This method can be handy to put in a stream pipeline, but it comes with a price. Internally `stream()` builds up a buffer of `sampleSize` bytes, used as a sample, to determine the file type. The sample size impacts the file detection resolution. A smaller sample size will result in lower probability of the best file type detection.
*/
export function fileTypeStream(webStream: AnyWebReadableStream<Uint8Array>, options?: StreamOptions): Promise<AnyWebReadableByteStreamWithFileType>;

export declare class FileTypeParser {
	detectors: Iterable<Detector>;

	constructor(options?: {customDetectors?: Iterable<Detector>; signal?: AbortSignal});

	/**
	Works the same way as {@link fileTypeFromBuffer}, additionally taking into account custom detectors (if any were provided to the constructor).
	*/
	fromBuffer(buffer: Uint8Array | ArrayBuffer): Promise<FileTypeResult | undefined>;

	/**
	Works the same way as {@link fileTypeFromTokenizer}, additionally taking into account custom detectors (if any were provided to the constructor).
	*/
	fromTokenizer(tokenizer: ITokenizer): Promise<FileTypeResult | undefined>;

	/**
	Works the same way as {@link fileTypeFromBlob}, additionally taking into account custom detectors (if any were provided to the constructor).
	*/
	fromBlob(blob: Blob): Promise<FileTypeResult | undefined>;

	/**
	Works the same way as {@link fileTypeStream}, additionally taking into account custom detectors (if any were provided to the constructor).
	*/
	toDetectionStream(webStream: AnyWebReadableStream<Uint8Array>, options?: StreamOptions): Promise<AnyWebReadableByteStreamWithFileType>;
}
