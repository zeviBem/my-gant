export interface Task {
  id: string;
  title: string;
  start: Date;
  end: Date;
  categoryId?: string;
}
