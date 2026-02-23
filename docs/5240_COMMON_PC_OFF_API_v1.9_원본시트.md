# 5240 COMMON PC OFF API v1.9 (엑셀 원본 시트 정리)

엑셀 규격서 `5240_COMMON_PC_OFF_API_v1.9.xlsx`의 워크시트 내용을 그대로 문서화한 문서입니다.  
구현용 통합 규격은 루트의 `PC_OFF_AGENT_API.md`를 참고하세요.

**Base URL:** `https://api.tigris5240.com`  
**공통:** TYPE `HTTPS/POST`, Request/Response `type:json`(JSON).

---

## 시트 1. API 리스트

| 순번 | API 리스트 | 비고 |
|------|------------|------|
| 1 | 서비스영역 리스트 조회 api | 전화번호로 접속가능한 서비스영역 리스트 리턴 |
| 2 | 로그인 api | 로그인에 필요한 정보를 받아서 암호화된 서비스영역과 직원 아이디 리턴 |
| 3 | 시간조회(시업,종업, PC-ON,PC-OFF,출근체크,퇴근체크) | 로그인 한 직원의 다양한 시간 정보 리턴 |
| 4 | 임시연장 호출 | 임시연장처리 후 시간정보 조회 리턴 |
| 5 | 긴급사용 호출 | 긴급사용 처리 후 시간정보 조회 리턴 |
| 6 | 로그기록 호출 API | PC ON/OFF 시 로그를 기록하는 API |

---

## 시트 2. Error Code

| 애러코드 | 설명 |
|----------|------|
| 1 | 조회 성공 |
| -1 | 조회 실패 |
| -4 | 데이터 처리 오류 |
| -5 | 임시연장 실패 |
| -9 | 기타 알수 없는 오류 |
| 500 | 내부 서버 오류 |

---

## 시트 3. 서비스영역 리스트 조회 API

### REQUEST

| 항목 | 값 |
|------|-----|
| TYPE | HTTPS/POST |
| URL | https://api.tigris5240.com/getPcOffServareaInfo.do |
| Description | 전화번호받아서 접속가능한 서비스 영역 리스트를 리턴 |

**Request Param** (`type:json`)

```json
[
   {
        "userMobileNo": "로그인 유저 휴대폰 번호"
    },
    {.....}
]
```

### RESPONSE

| 항목 | 값 |
|------|-----|
| TYPE | JSON |

**VALUES**

```json
[
    {
        "msg": "정상적으로 조회되었습니다.",
        "code": 1,
        "servareaList": "[{servareaId=..., servareaNm=...}, ...] (접속가능 서비스영역 리스트)",
        "userMobileNo": "01086325458 (호출시 전달받은 전화번호)"
    }
]
```

---

## 시트 4. 로그인 API

### REQUEST

| 항목 | 값 |
|------|-----|
| TYPE | HTTPS/POST |
| URL | https://api.tigris5240.com/getPcOffLoginUserInfo.do |
| Description | pc-off 에서 로그인 하는 특정 사용자에 대한 서비스 영역 및 직원 아이디 리턴 |

**Request Param** (`type:json`)

```json
[
   {
        "userMobileNo": "로그인 유저 휴대폰 번호",
        "loginServareaId": "로그인 서비스영역(암호화)",
        "loginUserId": "로그인 유저 아이디",
        "loginPassword": "로그인 유저 패스워드"
    },
    {.....}
]
```

### RESPONSE

| 항목 | 값 |
|------|-----|
| TYPE | JSON |

**VALUES**

- `code`: 처리 결과 코드
- `msg`: 처리결과 메세지(UTF-8 로 인코딩된 메세지 — 한글깨짐방지위해 UTF-8 로 디코딩해서 사용해야 함)
- `userMobileNo`: 로그인 유저 휴대폰 번호
- `loginUserId`: 로그인 유저 아이디
- `loginUserNm`: 로그인 유저 성명
- `corpNm`: 로그인 유저 회사명
- `posNm`: 로그인 유저 직위
- `resNm`: 로그인 유저 직책
- `message1` ~ `message5`: 메시지1~5
- `userServareaId`: 암호화된 서비스영역 아이디
- `userStaffId`: 암호화된 직원 아이디

---

## 시트 5. 시간조회 API (getPcOffWorkTime)

### REQUEST

| 항목 | 값 |
|------|-----|
| TYPE | HTTPS/POST |
| URL | https://api.tigris5240.com/getPcOffWorkTime.do |
| Description | pc-off 에서 특정 사용자에 대해 해당 근무일자에 근태 관련 시간 데이터들을 조회 |

**Request Param** (`type:json`)

```json
[
   {
        "userServareaId": "aaaaaaaaaaa (암호화된 서비스영역 아이디)",
        "userStaffId": "bbbbbbbbbbbb (암호화된 직원 아이디)",
        "workYmd": "근무일자(YYYYMMDD)"
    },
    {.....}
]
```

### RESPONSE

| 항목 | 값 |
|------|-----|
| TYPE | JSON |

**VALUES** — `code`, `msg`(UTF-8 디코딩 후 사용) 외 아래 필드 포함

| 필드 | 설명 |
|------|------|
| userServareaId, userStaffId | 암호화된 서비스영역 아이디, 직원 아이디 |
| staYmdTime | 시업시간(YYYYMMDDHH24MI) |
| endYmdTime | 종업시간(YYYYMMDDHH24MI) |
| pcOnYmdTime | PC-ON 시간(YYYYMMDDHH24MI) |
| pcOffYmdTime | PC-OFF 시간(임시연장 적용된 종료시간, YYYYMMDDHH24MI) |
| checkTime | 출퇴근 체크시간(값이 없으면 ##N) |
| workTypeCd, workTypeNm | 근무유형코드, 근무유형명(고객사별 상이) |
| freeTimeWorkTypeYn | 자율근무제 여부(Y/N) |
| workYmd | 근무일자(YYYYMMDD) |
| pcOffTargetYn | PC-OFF 적용 대상 여부(Y/N) |
| exCountRenewal | 임시연장 차수 초기화 기준시간(YYYYMMDDHH24MI) |
| pcExCount | 해당 근무일자 임시연장 사용 횟수 |
| pcExMaxCount | 임시연장 최대 가능 횟수 |
| pcExTime | 임시연장 1회당 추가 가능 시간(분) |
| pcMealStaTime, pcMealEndTime | 휴게(식사) 시작·종료 시간(YYYYMMDDHH24MI) |
| pcOnYn | PC 사용 가능 일자 여부 (Y/N) |
| pcOnMsg | PC 사용 안내 메시지 |
| workZoneQtyType | 근무구역 관리 유형(예: ZONE 등) |
| pcoffEmergencyYesNo | PC-OFF 긴급사용 기능 사용 여부(YES/NO) |
| emergencyUseYesNo | 긴급사용 승인 여부(YES/NO) |
| emergencyUsePass | 긴급사용 비밀번호(없을 경우 text로 null) |
| emergencyReasonYesNo | 긴급사용 사유 입력 여부(YES/NO) |
| emergencyStaDate | 긴급사용 시작시간(YYYYMMDDHH24MI 또는 YYYYMMDDHH24MISS) |
| emergencyEndDate | 긴급사용 종료시간(YYYYMMDDHH24MI 또는 YYYYMMDDHH24MISS) |
| nextYmd | 익일 근무일자(YYYYMMDD) |
| leaveSeatUseYn | 이석관리 사용 여부(YES/NO) |
| leaveSeatTime | 이석 시 자동 화면잠금 기준시간(분) |
| leaveSeatReasonTime | 이석 후 사유 입력 기준시간(분) |
| leaveSeatReasonYn | 이석 후 PC ON 시 사유 입력 여부(YES/NO) |
| leaveSeatReasonManYn | 이석 사유 입력 필수 여부(YES/NO) |
| leaveSeatOffInputMath | 이석 관련 입력 처리 구분값(0/1/2/3) |
| weekCreWorkTime | 주 기준 근로시간 |
| weekWorkTime | 해당 주 누적 근로시간 |
| weekLmtOtTime | 주 연장근로 한도 시간 |
| weekUseOtTime | 주 연장근로 사용 시간 |
| weekApplOtTime | 주 연장근로 신청 시간 |
| apiCallLogYesNo | API 호출 로그 저장 여부(YES/NO) |
| pcoffLoginYn | PC-OFF 상태에서 로그인 가능 여부(Y/N) |

---

## 시트 6. 임시연장 호출 API

### REQUEST

| 항목 | 값 |
|------|-----|
| TYPE | HTTPS/POST |
| URL | https://api.tigris5240.com/callPcOffTempDelay.do |
| Description | pc-off 에서 특정 사용자가 임시연장을 하는 경우, 임시연장 작업 5240 서버에 진행 후, 임시연장이 처리된 이후의 근태 관련 시간 데이터를 조회해서 리턴 |

**Request Param** (`type:json`)

```json
[
   {
        "userServareaId": "aaaaaaaaaaa (암호화된 서비스영역 아이디)",
        "userStaffId": "bbbbbbbbbbbb (암호화된 직원 아이디)",
        "workYmd": "근무일자(YYYYMMDD)",
        "extCount": "임시연장 차수(1,2)"
    },
    {.....}
]
```

### RESPONSE

| 항목 | 값 |
|------|-----|
| TYPE | JSON |

**VALUES** — 시트 5(시간조회)와 동일한 근태 시간 데이터 구조 (code, msg, userServareaId, userStaffId, staYmdTime, endYmdTime, pcOnYmdTime, pcOffYmdTime, checkTime, workTypeCd, workTypeNm, freeTimeWorkTypeYn, workYmd, pcOffTargetYn, exCountRenewal, pcExCount, pcExMaxCount, pcExTime, pcMealStaTime, pcMealEndTime, pcOnYn, pcOnMsg, workZoneQtyType, pcoffEmergencyYesNo, emergencyUseYesNo, emergencyUsePass, emergencyReasonYesNo, emergencyStaDate, emergencyEndDate, nextYmd, leaveSeatUseYn, leaveSeatTime, leaveSeatReasonTime, leaveSeatReasonYn, leaveSeatReasonManYn, leaveSeatOffInputMath, weekCreWorkTime, weekWorkTime, weekLmtOtTime, weekUseOtTime, weekApplOtTime, apiCallLogYesNo, pcoffLoginYn)

---

## 시트 7. 긴급사용 호출 API

### REQUEST

| 항목 | 값 |
|------|-----|
| TYPE | HTTPS/POST |
| URL | https://api.tigris5240.com/callPcOffEmergencyUse.do |
| Description | pc-off 긴급사용 요청시 호출. 호출 후 pc-off 에서 체크 할 수 있도록 긴급사용 비밀번호 및 긴급사용 시간 리턴 |

**Request Param** (`type:json`)

```json
[
   {
        "userServareaId": "aaaaaaaaaaa (암호화된 서비스영역 아이디)",
        "userStaffId": "bbbbbbbbbbbb (암호화된 직원 아이디)",
        "workYmd": "근무일자(YYYYMMDD)",
        "clickIp": "127.0.0.1//WINDOW (호출하는 PC 의 IP/GPS/OS 를 '/' 문자로 연결하여 전달 -> 필수 아님)",
        "reason": "긴급사용 사유 (사유여부가 필수인 경우 입력받음)"
    },
    {.....}
]
```

### RESPONSE

| 항목 | 값 |
|------|-----|
| TYPE | JSON |

**VALUES** — 시트 5(시간조회)와 동일한 근태 시간 데이터 구조 (갱신된 긴급사용 비밀번호·긴급사용 시간 등 포함)

---

## 시트 8. 로그기록 호출 API

### REQUEST

| 항목 | 값 |
|------|-----|
| TYPE | HTTPS/POST |
| URL | https://api.tigris5240.com/callCmmPcOnOffLogPrc.do |
| Description | PC ON/OFF 시 로그를 기록하는 API (엑셀 시트8 원본에는 긴급사용 설명이 잘못 복사되어 있음 — 여기서는 API 목적에 맞게 기재) |

**Request Param** (`type:json`)

```json
[
   {
        "userServareaId": "aaaaaaaaaaa (암호화된 서비스영역 아이디)",
        "userStaffId": "bbbbbbbbbbbb (암호화된 직원 아이디)",
        "workYmd": "근무일자(YYYYMMDD)",
        "recoder": "PC-OFF (고정값)",
        "tmckButnCd": "IN (IN/OUT — 켜질때 IN, 꺼질때 OUT)",
        "reason": "사유 (사유여부가 필수인 경우 입력받음)",
        "emergencyYn": "N/0.5/1210/1240 (긴급사용 여부(YorN)/이석시간(시간단위, 소수점7자리까지)/이석시작시간(HHMI)/이석종료시간(HHMI)/이석중비근무시간)"
    },
    {.....}
]
```

### NOTE — 이석 중 비근무 시간 기준

getWorkTime API 리턴 값 중 **leaveSeatOffInputMath** 값 기준:

| 값 | 의미 | 전달 |
|----|------|------|
| 0 | 사용 안함 | 전달 안 해도 됨 |
| 1 | 비근무시간 입력 | 입력 받은 값 그대로 전달 |
| 2 | 근무중이석시간으로 자동입력 | 0 전달 |
| 3 | 근무이석(1)/비근무이석(2) 선택 | 콤보 1 → 근무이석이므로 0 전달. 콤보 2 → 비근무 이석이므로 1 이상의 값 전달 |

- 위 **2, 3**의 경우 서버로 이석 시작시간·종료시간 전달하고 있어서 **서버에서 시간 재계산**함.

### RESPONSE

| 항목 | 값 |
|------|-----|
| TYPE | JSON |

**VALUES** — 시트 5(시간조회)와 동일한 근태 시간 데이터 구조 (code, msg, userServareaId, userStaffId, staYmdTime, endYmdTime, pcOnYmdTime, pcOffYmdTime, checkTime, workTypeCd, workTypeNm, … , apiCallLogYesNo, pcoffLoginYn)

---

*이 문서는 5240_COMMON_PC_OFF_API_v1.9.xlsx 워크시트를 옮겨 적은 것으로, 구현 시에는 `PC_OFF_AGENT_API.md`를 기준으로 하세요.*
