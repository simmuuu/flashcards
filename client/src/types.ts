export interface Card {
  _id: string;
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
  isShared?: boolean;
  shareId?: string;
  sharedBy?: {
    _id: string;
    name: string;
  };
  status?: "processing" | "completed" | "failed";
}

export interface SharedFolder {
  folder: {
    _id: string;
    name: string;
    createdBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
  };
  cards: {
    front: string;
    back: string;
  }[];
}
