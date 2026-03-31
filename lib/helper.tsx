import { pool } from '@/lib/db'
// generate Member Code 8 หลัก แบบสุ่มตัวเลข
export async function generateMemberCode() {
    let code = Math.floor(10000000 + Math.random() * 90000000).toString();
    // check ซ้ำใน DB ก่อน
    const result: any = await pool.query('SELECT * FROM members WHERE member_code = $1', [code])
    if (result.rowCount > 0) {
        // ถ้าซ้ำ ให้ generate ใหม่
        return generateMemberCode()
    }
    return code;
}

export function formatDateLocal(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}