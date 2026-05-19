-- ════════════════════════════════════════════════════════════
-- CalorieTracker DB 스키마 (MSSQL)
-- 실행할 때마다 기존 테이블 삭제 후 재생성
-- ════════════════════════════════════════════════════════════
--DB이름작성
USE WB43;
GO

-- ─────────────────────────────────────────────────────────────
-- 0. 기존 View · 테이블 삭제
--    외래키 제약 때문에 자식 테이블부터 삭제해야 함
--    MealFoods → MealRecords → UserProfile 순서
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.vw_MealTotals', 'V') IS NOT NULL DROP VIEW dbo.vw_MealTotals;
IF OBJECT_ID('dbo.MealFoods',     'U') IS NOT NULL DROP TABLE dbo.MealFoods;
IF OBJECT_ID('dbo.MealRecords',   'U') IS NOT NULL DROP TABLE dbo.MealRecords;
IF OBJECT_ID('dbo.UserProfile',   'U') IS NOT NULL DROP TABLE dbo.UserProfile;
GO

-- ─────────────────────────────────────────────────────────────
-- 1. UserProfile — 사용자 신체 정보
-- ─────────────────────────────────────────────────────────────
CREATE TABLE dbo.UserProfile
(
    ProfileID        NVARCHAR(50)    PRIMARY KEY,  -- 버그수정: NVARCHAR → INT
    ProfilePW        NVARCHAR(50)    NULL,
    Name             NVARCHAR(50)    NOT NULL,
    Male             BIT             NOT NULL,              -- 1: 남, 0: 여
    Height           FLOAT           NOT NULL,              -- cm
    Weight           FLOAT           NOT NULL,              -- kg
    BirthDate        DATE            NULL,                  -- 생일
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
    ProfileID   NVARCHAR(50)          NOT NULL,                    -- 버그수정: NVARCHAR → INT
    MealType    TINYINT      NOT NULL,    -- 0:아침, 1:점심, 2:저녁, 3:간식
    MealDate    DATE         NOT NULL,    -- 식사 날짜
    CreatedAt   DATETIME2    NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_MealRecords_UserProfile
        FOREIGN KEY (ProfileID) REFERENCES dbo.UserProfile(ProfileID)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_MealRecords_Profile_Date ON dbo.MealRecords(ProfileID, MealDate);
CREATE INDEX IX_MealRecords_Date         ON dbo.MealRecords(MealDate);
GO

-- ─────────────────────────────────────────────────────────────
-- 3. MealFoods — 식사에 포함된 개별 음식
-- ─────────────────────────────────────────────────────────────
CREATE TABLE dbo.MealFoods
(
    MealFoodID    INT           IDENTITY(1,1) PRIMARY KEY,
    MealID        INT           NOT NULL,
    FoodName      NVARCHAR(100) NOT NULL,
    IntakeAmount  FLOAT         NOT NULL,           -- g

    -- 영양 정보
    Calories      FLOAT         NOT NULL DEFAULT 0, -- kcal
    Protein       FLOAT         NOT NULL DEFAULT 0, -- g
    Carbohydrate  FLOAT         NOT NULL DEFAULT 0, -- g
    Fat           FLOAT         NOT NULL DEFAULT 0, -- g
    Sodium        FLOAT         NOT NULL DEFAULT 0, -- mg
    Sugar         FLOAT         NOT NULL DEFAULT 0, -- g

    CONSTRAINT FK_MealFoods_MealRecords
        FOREIGN KEY (MealID) REFERENCES dbo.MealRecords(MealID)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_MealFoods_MealID ON dbo.MealFoods(MealID);
GO

-- ─────────────────────────────────────────────────────────────
-- 4. vw_MealTotals — 식사별 영양 합계 View
--    MealFoods를 SUM해서 반환하므로 항상 정확한 값 보장
-- ─────────────────────────────────────────────────────────────
CREATE VIEW dbo.vw_MealTotals
AS
SELECT
    r.MealID,
    r.ProfileID,
    r.MealType,
    r.MealDate,                              -- 버그수정: MealTime 제거 (컬럼 없음)
    ISNULL(SUM(f.Calories),     0) AS TotalCalories,
    ISNULL(SUM(f.Protein),      0) AS TotalProtein,
    ISNULL(SUM(f.Carbohydrate), 0) AS TotalCarb,
    ISNULL(SUM(f.Fat),          0) AS TotalFat
FROM dbo.MealRecords r
LEFT JOIN dbo.MealFoods f ON r.MealID = f.MealID
GROUP BY r.MealID, r.ProfileID, r.MealType, r.MealDate;
GO

-- ─────────────────────────────────────────────────────────────
-- 5. 초기 데이터 (Seed)
-- ─────────────────────────────────────────────────────────────
INSERT INTO dbo.UserProfile (ProfileID,ProfilePW,Name, Male, Height, Weight, BirthDate, TargetCalories)
VALUES ('admin','1234','기본 사용자', 1, 175, 70, '1995-01-01', 2000);
GO

PRINT N'✓ 스키마 생성 완료';