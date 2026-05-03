-- APDS7311 Payments Portal — Task 2 schema
-- Run against PaymentsPortalDb (Azure Portal > SQL databases > PaymentsPortalDb > Query editor)

CREATE TABLE Customers (
  CustomerId    INT IDENTITY(1,1) PRIMARY KEY,
  FullName      NVARCHAR(100) NOT NULL,
  IdNumber      NVARCHAR(13)  NOT NULL UNIQUE,
  AccountNumber NVARCHAR(12)  NOT NULL UNIQUE,
  PasswordHash  NVARCHAR(255) NOT NULL,
  CreatedAt     DATETIME      DEFAULT GETDATE()
);

CREATE TABLE Transactions (
  TransactionId INT IDENTITY(1,1) PRIMARY KEY,
  CustomerId    INT           NOT NULL FOREIGN KEY REFERENCES Customers(CustomerId),
  FullName      NVARCHAR(100) NOT NULL,
  AccountNumber NVARCHAR(12)  NOT NULL,
  Amount        DECIMAL(18,2) NOT NULL,
  Currency      NVARCHAR(3)   NOT NULL,
  Provider      NVARCHAR(20)  DEFAULT 'SWIFT',
  PayeeAccount  NVARCHAR(12)  NOT NULL,
  SwiftCode     NVARCHAR(11)  NOT NULL,
  Status        NVARCHAR(20)  DEFAULT 'pending',
  CreatedAt     DATETIME      DEFAULT GETDATE(),
  -- Task 3 columns — NULL for now, wired up when employee portal is added
  VerifiedBy    INT           NULL,
  SubmittedAt   DATETIME      NULL
);
