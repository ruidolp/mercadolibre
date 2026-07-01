// lib/schema.ts
import { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface MlAppsTable {
  id: Generated<string>;
  name: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MlTokensTable {
  id: Generated<string>;
  app_id: string;
  ml_user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: Generated<string>;
  expires_in: number;
  expires_at: Date;
  scope: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  ml_apps: MlAppsTable;
  ml_tokens: MlTokensTable;
}

// Convenience types
export type MlApp = Selectable<MlAppsTable>;
export type NewMlApp = Insertable<MlAppsTable>;
export type MlAppUpdate = Updateable<MlAppsTable>;

export type MlToken = Selectable<MlTokensTable>;
export type NewMlToken = Insertable<MlTokensTable>;
export type MlTokenUpdate = Updateable<MlTokensTable>;

// Token with joined app name
export interface MlTokenWithApp extends MlToken {
  app_name: string;
  app_client_id: string;
}
