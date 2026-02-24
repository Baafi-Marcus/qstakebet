
import { isSelectionWinner } from "./lib/settlement";

function testSettlement() {
    console.log("🧪 Testing Settlement Overrides...");

    const match = { sportType: "quiz", status: "finished" } as any;
    const result_lower = { metadata: { outcomes: { "match winner": "school-1" } } } as any;
    const result_upper = { metadata: { outcomes: { "MATCH WINNER": "school-1" } } } as any;
    const result_mixed = { metadata: { outcomes: { "mAtCh WiNnEr ": "school-1" } } } as any;

    const test_cases = [
        { name: "Lowercase Key", res: result_lower, expected: true },
        { name: "Uppercase Key", res: result_upper, expected: true },
        { name: "Mixed Case & Space Key", res: result_mixed, expected: true },
        { name: "Wrong Selection", res: result_lower, expected: false, sid: "school-2" }
    ];

    test_cases.forEach(t => {
        const resolution = isSelectionWinner(t.sid || "school-1", "Match Winner", "1", match, t.res);
        const pass = resolution.isWin === t.expected;
        console.log(`${pass ? "✅" : "❌"} ${t.name}: Expected ${t.expected}, Got ${resolution.isWin}`);
    });
}

testSettlement();
