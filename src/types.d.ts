export interface DiaryEntry {
  id: number
  date: string
  comment: string
}

export type NonSensitiveInfoDiaryEntry = Omit<DiaryEntry, 'comment'>
export type NewDiaryEntry = Omit<DiaryEntry, 'id'>
