import { join } from "node:path";
import { readJson, writeJson } from "./storage.js";
import { PATHS } from "./constants.js";

export interface RuntimeConfig {
  apiBaseUrl: string;
  userServareaId: string;
  userStaffId: string;
}

export interface AppState {
  userServareaId?: string;
  userStaffId?: string;
  loginUserId?: string;
  loginUserNm?: string;
  posNm?: string;
  corpNm?: string;
  lastLoginAt?: string;
  /** 임시연장 복원용: 연장 만료 시각(YYYYMMDDHH24MI). 이 시각 전까지 재시작 시 lastWorkTimeSnapshot 복원 */
  tempExtendUntil?: string;
  /** 임시연장 복원용: 연장 적용 직후 근태 스냅샷(pcExCount, pcOffYmdTime 등 포함) */
  lastWorkTimeSnapshot?: Record<string, unknown>;
}

/** 로그인된 사용자 표시용 정보 (state.json에서 읽음) */
export async function getLoginUserDisplay(baseDir: string): Promise<{
  loginUserNm?: string;
  loginUserId?: string;
  posNm?: string;
  corpNm?: string;
}> {
  const statePath = join(baseDir, PATHS.state);
  const state = await readJson<AppState>(statePath, {});
  return {
    loginUserNm: state.loginUserNm,
    loginUserId: state.loginUserId,
    posNm: state.posNm,
    corpNm: state.corpNm
  };
}

/** API 베이스 URL만 (로그인 화면에서 서비스영역/로그인 호출용) */
export async function getApiBaseUrl(baseDir: string): Promise<string | null> {
  const fromConfig = await readJson<{ apiBaseUrl?: string }>(join(baseDir, PATHS.config), {});
  return process.env.PCOFF_API_BASE_URL ?? fromConfig.apiBaseUrl ?? null;
}

/** 로그인 정보는 state.json에서만, API URL은 config.json에서 */
export async function loadRuntimeConfig(baseDir: string): Promise<RuntimeConfig | null> {
  const statePath = join(baseDir, PATHS.state);
  const configPath = join(baseDir, PATHS.config);
  const state = await readJson<AppState>(statePath, {});
  const fromConfig = await readJson<Partial<RuntimeConfig>>(configPath, {});

  const apiBaseUrl = process.env.PCOFF_API_BASE_URL ?? fromConfig.apiBaseUrl;
  const userServareaId = process.env.PCOFF_USER_SERVAREA_ID ?? state.userServareaId;
  const userStaffId = process.env.PCOFF_USER_STAFF_ID ?? state.userStaffId;

  if (!apiBaseUrl || !userServareaId || !userStaffId) return null;
  return { apiBaseUrl, userServareaId, userStaffId };
}

export async function saveLoginState(baseDir: string, state: AppState): Promise<void> {
  const statePath = join(baseDir, PATHS.state);
  const existing = await readJson<AppState>(statePath, {});
  await writeJson(statePath, { ...existing, ...state, lastLoginAt: new Date().toISOString() });
}

/** 임시연장 상태 저장 (재시작 후 복원용). 연장 만료 시각까지 state.json에 보관 */
export async function saveTempExtendState(
  baseDir: string,
  snapshot: Record<string, unknown>,
  untilYmdHm: string
): Promise<void> {
  const statePath = join(baseDir, PATHS.state);
  const existing = await readJson<AppState>(statePath, {});
  await writeJson(statePath, {
    ...existing,
    lastWorkTimeSnapshot: snapshot,
    tempExtendUntil: untilYmdHm
  });
}

/** state.json에서 임시연장 스냅샷 복원. 만료 시각이 미래이면 { snapshot, until } 반환, 아니면 null */
export async function loadTempExtendState(baseDir: string): Promise<{
  snapshot: Record<string, unknown>;
  until: string;
} | null> {
  const statePath = join(baseDir, PATHS.state);
  const state = await readJson<AppState>(statePath, {});
  const until = state.tempExtendUntil;
  const snapshot = state.lastWorkTimeSnapshot;
  if (!until || !snapshot || typeof snapshot !== "object") return null;
  return { snapshot, until };
}

/** 로그아웃: state.json + config.json에서 로그인 관련 필드 모두 제거 */
export async function clearLoginState(baseDir: string): Promise<void> {
  const statePath = join(baseDir, PATHS.state);
  const existing = await readJson<AppState>(statePath, {});
  const {
    userServareaId,
    userStaffId,
    loginUserId,
    loginUserNm,
    posNm,
    corpNm,
    lastLoginAt,
    tempExtendUntil,
    lastWorkTimeSnapshot,
    ...rest
  } = existing;
  await writeJson(statePath, rest);

  const configPath = join(baseDir, PATHS.config);
  const config = await readJson<Record<string, unknown>>(configPath, {});
  if (config.userServareaId || config.userStaffId) {
    const { userServareaId: _a, userStaffId: _b, ...cleanConfig } = config;
    await writeJson(configPath, cleanConfig);
  }
}

