export interface Card {
  _id:string;
  front: string;
  back: string;
  nextReview: string;
  easinessFactor: number;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  cards?: Card[];
  createdAt: string;
  updatedAt: string;
}
