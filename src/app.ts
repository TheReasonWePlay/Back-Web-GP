import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import agentRoutes from './modules/agents/agent.routes';
import agentAttendanceRoutes from './modules/attendance/agentAttendance.routes';
import longAbsenceRoutes from './modules/longAbsence/longAbsence.routes';
import workScheduleRoutes from './modules/workSchedule/workSchedule.routes';
import calendarHolidayRoutes from './modules/calendarHoliday/calendarHoliday.routes';
import userRoutes from './modules/user/user.routes';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agents', agentAttendanceRoutes);
app.use('/api/agents', longAbsenceRoutes);
app.use('/api/schedules', workScheduleRoutes);
app.use('/api/holidays', calendarHolidayRoutes);
app.use('/api/users', userRoutes);

// health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK' }));

// error handler (dernier middleware)
app.use(errorHandler);

export default app;
