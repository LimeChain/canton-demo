import { parseJsonText } from "@canton-demo/shared";

export async function readResponsePayload(response: Response): Promise<unknown> {
    const text = await response.text();
    return parseJsonText(text);
}