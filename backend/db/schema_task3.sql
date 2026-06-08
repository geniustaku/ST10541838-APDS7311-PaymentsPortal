-- Task 3 schema additions. Run against PaymentsPortalDb.

-- Employees: pre-registered only, no public registration route exposes this table.
CREATE TABLE Employees (
  EmployeeId       INT IDENTITY(1,1) PRIMARY KEY,
  FullName         NVARCHAR(100) NOT NULL,
  Username         NVARCHAR(20)  NOT NULL UNIQUE,
  PasswordHash     NVARCHAR(255) NOT NULL,
  Role             NVARCHAR(20)  NOT NULL DEFAULT 'employee',
  FailedLoginCount INT           NOT NULL DEFAULT 0,
  LockedUntil      DATETIME      NULL,
  CreatedAt        DATETIME      NOT NULL DEFAULT GETDATE()
);

-- Per-account lockout for customers in addition to the IP-level rate limiter.
ALTER TABLE Customers ADD FailedLoginCount INT NOT NULL DEFAULT 0;
ALTER TABLE Customers ADD LockedUntil DATETIME NULL;

-- Non-repudiation metadata captured at the moment an employee verifies a transaction.
ALTER TABLE Transactions ADD VerifiedAt DATETIME NULL;
ALTER TABLE Transactions ADD VerificationNotes NVARCHAR(500) NULL;

ALTER TABLE Transactions
  ADD CONSTRAINT FK_Transactions_Employees
  FOREIGN KEY (VerifiedBy) REFERENCES Employees(EmployeeId);

-- Audit trail for sensitive actions: logins, transaction creation, verification, SWIFT submission.
CREATE TABLE AuditLog (
  AuditId    BIGINT IDENTITY(1,1) PRIMARY KEY,
  Actor      NVARCHAR(50)  NOT NULL,
  Action     NVARCHAR(50)  NOT NULL,
  TargetType NVARCHAR(20)  NULL,
  TargetId   NVARCHAR(50)  NULL,
  IpAddress  NVARCHAR(45)  NULL,
  Notes      NVARCHAR(500) NULL,
  CreatedAt  DATETIME      NOT NULL DEFAULT GETDATE()
);
