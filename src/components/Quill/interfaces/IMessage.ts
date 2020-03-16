export enum EventType {
  CONTENT_CHANGE,
  OPEN_CLOUD_EDITOR,
  UPDATE_READONLY,
}

export interface IMessage {
  type: EventType
  data: any
}
