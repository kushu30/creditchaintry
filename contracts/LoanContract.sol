// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LoanContract {
    enum LoanStatus {
        Requested,
        Active,
        Repaid,
        Defaulted
    }

    struct Loan {
        address borrower;
        address lender;
        uint256 amount;
        uint256 duration;
        uint256 interestRate;
        uint256 repaymentAmount;
        uint256 creationTime;
        LoanStatus status;
    }

    mapping(address => Loan) public loans;
    address public insurancePool;

    event LoanRequested(address indexed borrower, uint256 amount, uint256 duration);
    event LoanApproved(address indexed borrower, address indexed lender, uint256 repaymentAmount);
    event LoanRepaid(address indexed borrower);
    event LoanDefaulted(address indexed borrower, address indexed lender);

    constructor() {
        insurancePool = msg.sender;
    }

    function requestLoan(uint256 amount, uint256 duration, uint256 interestRate) public {
        require(loans[msg.sender].status == LoanStatus.Repaid || loans[msg.sender].status == LoanStatus.Defaulted || loans[msg.sender].creationTime == 0, "An active loan already exists for this borrower.");
        
        loans[msg.sender] = Loan({
            borrower: msg.sender,
            lender: address(0),
            amount: amount,
            duration: duration,
            interestRate: interestRate,
            repaymentAmount: 0,
            creationTime: block.timestamp,
            status: LoanStatus.Requested
        });

        emit LoanRequested(msg.sender, amount, duration);
    }

    function approveLoan(address borrower) public {
        Loan storage loan = loans[borrower];
        require(loan.status == LoanStatus.Requested, "No loan request found or loan is not in requested state.");
        
        loan.lender = msg.sender;
        loan.status = LoanStatus.Active;
        loan.repaymentAmount = loan.amount + (loan.amount * loan.interestRate / 100);
        
        emit LoanApproved(borrower, msg.sender, loan.repaymentAmount);
    }

    function repayLoan() public {
        Loan storage loan = loans[msg.sender];
        require(loan.status == LoanStatus.Active, "No active loan to repay.");

        loan.status = LoanStatus.Repaid;
        emit LoanRepaid(msg.sender);
    }

    function triggerDefault(address borrower) public {
        Loan storage loan = loans[borrower];
        require(loan.lender == msg.sender, "Only the lender can trigger a default.");
        require(loan.status == LoanStatus.Active, "Loan is not active.");
        require(block.timestamp > loan.creationTime + loan.duration, "Loan term has not yet expired.");
        
        loan.status = LoanStatus.Defaulted;

        emit LoanDefaulted(borrower, loan.lender);
    }
}
