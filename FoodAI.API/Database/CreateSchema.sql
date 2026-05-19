-- ════════════════════════════════════════════════════════════
-- CalorieTracker DB 스키마 (MSSQL) — 개선 반영 버전
-- ════════════════════════════════════════════════════════════

USE CalorieTracker;
GO

-- 외래키 제약 때문에 자식 테이블부터 삭제
IF OBJECT_ID('dbo.MealFoods', 'U')    IS NOT NULL DROP TABLE dbo.MealFoods;
IF OBJECT_ID('dbo.MealRecords', 'U')  IS NOT NULL DROP TABLE dbo.MealRecords;
IF OBJECT_ID('dbo.UserProfile', 'U')  IS NOT NULL DROP TABLE dbo.UserProfile;
GO

-- ─────────────────────────────────────────────────────────────
-- 1. UserProfile — 사용자 신체 정보
-- ─────────────────────────────────────────────────────────────
CREATE TABLE dbo.UserProfile
(
    ProfileID        INT             PRIMARY KEY,
    Name             NVARCHAR(50)    NOT NULL,
    Male             BIT             NOT NULL,              -- 1: 남, 0: 여
    Height           FLOAT           NOT NULL,              -- cm
    Weight           FLOAT           NOT NULL,              -- kg
    BirthDate        DATE            NULL,                  -- 생일 (Age 대신)
    TargetCalories   FLOAT           NOT NULL DEFAULT 2000, -- kcal/일
    CreatedAt        DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ─────────────────────────────────────────────────────────────
-- 2. MealRecords — 식사 단위 기록 (한 끼)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE dbo.MealRecords
(
    MealID      INT          IDENTITY(1,1) PRIMARY KEY,
    ProfileID   INT          NOT NULL,
    MealType    TINYINT      NOT NULL,    -- 0:아침, 1:점심, 2:저녁, 3:간식
    MealDate    DATE         NOT NULL,    -- 식사 날짜
    MealTime    TIME         NOT NULL,    -- 식사 시간
    CreatedAt   DATETIME2    NOT NULL DEFAULT GETDATE(),

    -- 외래키
    CONSTRAINT FK_MealRecords_UserProfile
        FOREIGN KEY (ProfileID) REFERENCES dbo.UserProfile(ProfileID)
        ON DELETE CASCADE
);
GO

-- 날짜별 조회 성능을 위한 인덱스
CREATE INDEX IX_MealRecords_Profile_Date
    ON dbo.MealRecords(ProfileID, MealDate);
CREATE INDEX IX_MealRecords_Date
    ON dbo.MealRecords(MealDate);
GO

-- ─────────────────────────────────────────────────────────────
-- 3. MealFoods — 식사에 포함된 개별 음식
-- ─────────────────────────────────────────────────────────────
CREATE TABLE dbo.MealFoods
(
    MealFoodID    INT             IDENTITY(1,1) PRIMARY KEY,
    MealID        INT             NOT NULL,
    FoodName      NVARCHAR(100)   NOT NULL,
    IntakeAmount  FLOAT           NOT NULL,        -- g

    -- 영양 정보
    Calories      FLOAT           NOT NULL DEFAULT 0,
    Protein       FLOAT           NOT NULL DEFAULT 0,
    Carbohydrate  FLOAT           NOT NULL DEFAULT 0,
    Fat           FLOAT           NOT NULL DEFAULT 0,
    Sodium        FLOAT           NOT NULL DEFAULT 0,
    Sugar         FLOAT           NOT NULL DEFAULT 0,  -- 당류 추가

    -- 외래키 (식사 삭제 시 음식도 자동 삭제)
    CONSTRAINT FK_MealFoods_MealRecords
        FOREIGN KEY (MealID) REFERENCES dbo.MealRecords(MealID)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_MealFoods_MealID ON dbo.MealFoods(MealID);
GO

-- ─────────────────────────────────────────────────────────────
-- 4. 총 영양 정보는 뷰(View)로 — 계산 결과를 테이블처럼 사용
--    실제 컬럼이 아니라 매번 SUM 계산하므로 항상 정확함
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.vw_MealTotals', 'V') IS NOT NULL DROP VIEW dbo.vw_MealTotals;
GO

CREATE VIEW dbo.vw_MealTotals
AS
SELECT
    r.MealID,
    r.ProfileID,
    r.MealType,
    r.MealDate,
    r.MealTime,
    ISNULL(SUM(f.Calories),     0) AS TotalCalories,
    ISNULL(SUM(f.Protein),      0) AS TotalProtein,
    ISNULL(SUM(f.Carbohydrate), 0) AS TotalCarb,
    ISNULL(SUM(f.Fat),          0) AS TotalFat
FROM dbo.MealRecords r
LEFT JOIN dbo.MealFoods f ON r.MealID = f.MealID
GROUP BY r.MealID, r.ProfileID, r.MealType, r.MealDate, r.MealTime;
GO

-- ─────────────────────────────────────────────────────────────
-- 5. 초기 데이터
-- ─────────────────────────────────────────────────────────────
INSERT INTO dbo.UserProfile (Name, Male, Height, Weight, BirthDate, TargetCalories)
VALUES (N'기본 사용자', 1, 175, 70, '1995-01-01', 2000);
GO

PRINT '✓ 스키마 생성 완료';
