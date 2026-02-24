/**
 * installer-registry.ts
 * FR-09: 설치자 레지스트리 — 설치 정보를 로컬에 기록하고 서버 동기화를 시도한다.
 *
 * 수집 항목:
 *   deviceId       — 최초 생성 시 부여되는 기기 고유 ID (UUID)
 *   installedAt    — 레지스트리 파일 최초 생성 시각 (ISO8601)
 *   platform       — process.platform (darwin / win32 / linux)
 *   osRelease      — OS 버전 문자열
 *   hostname       — 기기 호스트명
 *   appVersion     — 앱 버전
 *   installerStaffId — 설치 수행자 사번 (state.json 기준, 없으면 "unknown")
 *   lastSyncAt     — 마지막 서버 동기화 성공 시각
 *   syncStatus     — "pending" | "synced" | "failed"
 */

import { randomUUID } from "node:crypto";
import { hostname, release } from "node:os";
import { join } from "node:path";
import { readJson, writeJson } from "./storage.js";
import { PATHS } from "./constants.js";

export interface InstallerRegistry {
  deviceId: string;
  installedAt: string;
  platform: string;
  osRelease: string;
  hostname: string;
  appVersion: string;
  installerStaffId: string;
  lastSyncAt: string | null;
  syncStatus: "pending" | "synced" | "failed";
}

export interface LoadInstallerRegistryResult {
  registry: InstallerRegistry;
  /** true면 이번 호출에서 신규 생성됨(첫 실행/설치 후) */
  created: boolean;
}

/**
 * 설치자 레지스트리를 로드하거나 최초 생성한다.
 * 기존 파일이 있으면 읽어 반환하고, 없으면 신규 생성 후 저장한다.
 */
export async function loadOrCreateInstallerRegistry(
  baseDir: string,
  appVersion: string,
  installerStaffId = "unknown"
): Promise<LoadInstallerRegistryResult> {
  const filePath = join(baseDir, PATHS.installerRegistry);
  const existing = await readJson<Partial<InstallerRegistry>>(filePath, {});

  if (existing.deviceId && existing.installedAt) {
    return {
      registry: { ...(existing as InstallerRegistry), appVersion },
      created: false
    };
  }

  // 최초 설치 — 새 레지스트리 생성
  const registry: InstallerRegistry = {
    deviceId: randomUUID(),
    installedAt: new Date().toISOString(),
    platform: process.platform,
    osRelease: release(),
    hostname: hostname(),
    appVersion,
    installerStaffId,
    lastSyncAt: null,
    syncStatus: "pending"
  };

  await writeJson(filePath, registry);
  return { registry, created: true };
}

/**
 * 서버 동기화를 시도한다.
 * 성공 시 syncStatus="synced"·lastSyncAt을 갱신하고 로컬에 저장한다.
 * 실패 시 syncStatus="failed"로 기록하고 예외를 던지지 않는다.
 */
export async function syncInstallerRegistry(
  baseDir: string,
  registry: InstallerRegistry,
  apiBaseUrl: string | null
): Promise<InstallerRegistry> {
  const filePath = join(baseDir, PATHS.installerRegistry);

  if (!apiBaseUrl) {
    const updated = { ...registry, syncStatus: "failed" as const };
    await writeJson(filePath, updated);
    return updated;
  }

  try {
    const url = `${apiBaseUrl}/registerInstallerInfo.do`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: registry.deviceId,
        installedAt: registry.installedAt,
        platform: registry.platform,
        osRelease: registry.osRelease,
        hostname: registry.hostname,
        appVersion: registry.appVersion,
        installerStaffId: registry.installerStaffId
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const updated: InstallerRegistry = {
      ...registry,
      lastSyncAt: new Date().toISOString(),
      syncStatus: "synced"
    };
    await writeJson(filePath, updated);
    return updated;
  } catch {
    const updated = { ...registry, syncStatus: "failed" as const };
    await writeJson(filePath, updated);
    return updated;
  }
}
