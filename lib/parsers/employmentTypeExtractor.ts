
/**
 * 雇用形態抽出ロジック
 */

export type EmploymentType = "full_time" | "contract" | "temporary" | "intern" | "other" | null;

export function extractEmploymentType(content: string): EmploymentType {
    const lines = content.split('\n');

    // 1. 「雇用形態」セクションを探す
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^(雇用形態|契約形態|Employment Type)[:：\s\t]*/.test(line)) {
            // 同じ行または次の行から値を抽出
            let value = line.replace(/^(雇用形態|契約形態|Employment Type)[:：\s\t]*/, '').trim();

            if (value.length === 0 && i + 1 < lines.length) {
                value = lines[i + 1].trim();
            }

            if (value.length > 0 && value.length < 50) {
                return mapToEmploymentType(value);
            }
        }
    }

    // 2. セクションが見つからない場合、全文からキーワード探索
    const contentLower = content.substring(0, 5000); // 先頭5000文字

    if (/正\s*社\s*員/i.test(contentLower)) return "full_time";
    if (/契約\s*社\s*員/i.test(contentLower)) return "contract";
    if (/業務委託/i.test(contentLower)) return "contract"; // 業務委託はcontractとするかotherとするか議論あるが一旦contract
    if (/派遣/i.test(contentLower)) return "temporary";
    if (/インターン/i.test(contentLower)) return "intern";
    if (/アルバイト|パート/i.test(contentLower)) return "other";

    return null;
}

function mapToEmploymentType(text: string): EmploymentType {
    if (/正\s*社\s*員|Full.*time/i.test(text)) return "full_time";
    if (/契約|Contract/i.test(text)) return "contract";
    if (/業務委託|Outsourc/i.test(text)) return "contract";
    if (/派遣|Dispatch/i.test(text)) return "temporary";
    if (/インターン|Intern/i.test(text)) return "intern";
    if (/アルバイト|パート|Part.*time/i.test(text)) return "other";

    return "other";
}
