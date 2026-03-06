import express from 'express';
import {
    getAIExpenseAnalysis,
    getAIRecommendations,
    getAISpendingForecast
} from '../controller/aiAnalysisController.js';

const router = express.Router();

// AI-powered analysis endpoints
router.get('/analysis', getAIExpenseAnalysis);
router.get('/recommendations', getAIRecommendations);
router.get('/forecast', getAISpendingForecast);

export default router;
