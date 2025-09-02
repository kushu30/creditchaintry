import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [trustScore, setTrustScore] = useState(0);
    const [loanTerms, setLoanTerms] = useState({ maxAmount: 0, interestRate: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [loanStatus, setLoanStatus] = useState('None');
    const [errorMessage, setErrorMessage] = useState('');

    const MOCK_BORROWER_DATA = {
        wallet_age_days: 365,
        transaction_volume_usd: 15000.50,
        defi_participation: true,
        repayment_streaks: 10,
    };

    const connectWallet = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                setWalletAddress(address);
                fetchTrustScore(MOCK_BORROWER_DATA);
            } else {
                setErrorMessage("MetaMask not found. Please install it to use this application.");
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            setErrorMessage("Failed to connect wallet. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrustScore = async (borrowerData) => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await fetch('http://127.0.0.1:8000/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(borrowerData),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.trust_score) {
                setTrustScore(data.trust_score);
            } else {
                throw new Error("Invalid response format from API.");
            }
        } catch (error) {
            console.error("Error fetching trust score:", error);
            setErrorMessage("Could not fetch Trust Score. Is the backend server running?");
            setTrustScore(0);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (trustScore > 0) {
            const maxAmount = trustScore * 100;
            const interestRate = Math.max(2, 20 - (trustScore / 5)).toFixed(2);
            setLoanTerms({ maxAmount, interestRate });
        }
    }, [trustScore]);

    const handleRequestLoan = () => {
        setLoanStatus('Requested');
        setTimeout(() => {
            setLoanStatus('Active');
        }, 2000);
    };

    const handleRepayLoan = () => {
        setLoanStatus('Repaid');
        const updatedData = { ...MOCK_BORROWER_DATA, repayment_streaks: MOCK_BORROWER_DATA.repayment_streaks + 1 };
        fetchTrustScore(updatedData);
        setTimeout(() => {
            setLoanStatus('None');
        }, 3000);
    };

    const handleDefaultLoan = () => {
        setLoanStatus('Defaulted');
        const updatedData = { ...MOCK_BORROWER_DATA, repayment_streaks: 0 };
        fetchTrustScore(updatedData);
    };

    const RadialGauge = ({ score }) => {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center w-32 h-32">
                <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="45" stroke="#374151" strokeWidth="10" fill="transparent" />
                    <motion.circle
                        cx="50%"
                        cy="50%"
                        r="45"
                        stroke="#34D399"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                </svg>
                <motion.span
                    className="text-3xl font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    {score}
                </motion.span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
                <header className="text-center">
                    <h1 className="text-4xl font-bold text-emerald-400">CrediChain</h1>
                    <p className="text-gray-400">Decentralized P2P Lending, Secured by Trust.</p>
                </header>

                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            className="p-3 bg-red-500/20 text-red-300 rounded-lg text-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {!walletAddress ? (
                    <div className="flex flex-col items-center">
                        <button
                            onClick={connectWallet}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-emerald-500 rounded-lg font-semibold hover:bg-emerald-600 transition-colors duration-300 disabled:bg-gray-600"
                        >
                            {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="p-4 bg-gray-700/50 rounded-lg text-center">
                            <p className="text-sm text-gray-400">Connected Wallet</p>
                            <p className="text-lg font-mono break-all">{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</p>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 bg-gray-900 rounded-xl">
                            <h2 className="text-xl font-semibold mb-4 text-gray-300">Your Trust Score</h2>
                            <RadialGauge score={trustScore} />
                        </div>

                        {trustScore > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-700/50 rounded-lg space-y-2">
                                <h3 className="text-lg font-semibold text-center">Your Loan Terms</h3>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Max Loan Amount:</span>
                                    <span className="font-bold text-emerald-400">${loanTerms.maxAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Interest Rate:</span>
                                    <span className="font-bold text-emerald-400">{loanTerms.interestRate}%</span>
                                </div>
                            </motion.div>
                        )}
                        
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                             <h3 className="text-lg font-semibold text-center mb-3">Loan Status: <span className="text-yellow-400">{loanStatus}</span></h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {loanStatus === 'None' && <button onClick={handleRequestLoan} className="w-full px-4 py-2 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors">Request Loan</button>}
                                {loanStatus === 'Active' && <button onClick={handleRepayLoan} className="w-full px-4 py-2 bg-green-500 rounded-lg font-semibold hover:bg-green-600 transition-colors">Make Repayment</button>}
                                {loanStatus === 'Active' && <button onClick={handleDefaultLoan} className="w-full px-4 py-2 bg-red-500 rounded-lg font-semibold hover:bg-red-600 transition-colors">Simulate Default</button>}
                                {loanStatus === 'Repaid' && <p className="text-green-400 text-center sm:col-span-2">Loan successfully repaid! Your score has improved.</p>}
                                {loanStatus === 'Defaulted' && <p className="text-red-400 text-center sm:col-span-2">Loan defaulted. Your score has been lowered.</p>}
                             </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default App;