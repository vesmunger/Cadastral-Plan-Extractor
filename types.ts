
export interface Point {
  x: number;
  y: number;
}

export interface Metadata {
  lotNumber: string;
  planNumber: string;
  surveyorName: string;
  surveyDate: string;
}

export interface ExtractedData {
  metadata: Metadata;
  polygon: Point[];
}

export interface ImageDimensions {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}
