export enum EventType {
  CONTENT_CHANGE,
  OPEN_CLOUD_EDITOR
}

export interface IMessage {
  type: EventType;
  data: any;
}
