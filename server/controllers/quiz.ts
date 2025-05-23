import  {Request , Response} from 'express';
import  Quiz  from '../models/quiz';
import  User  from '../models/user';
import Assignment from '../models/assignment';
import Question from '../models/question';
import QuizAttempt from "../models/quizAttempt";
import { AuthReq, IQuestion } from '../types';
import mongoose from 'mongoose';

export const getAllQuiz = async (req: Request, res: Response) => {
    try {
        const quiz = await Quiz.find({}).populate('assignment').populate({
            path: 'assignment',
            populate: {
                path: 'questions',
                model: 'Question'
            }
        }).populate({
            path: 'createdBy',
            select: 'username'
        });

        if(!quiz){
            return res.status(400).json({success : false , error: 'Quiz not found' });
        }

        return res.status(200).json({
            success: true,
            quiz,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server error',
        });
    }
};

export const getCompleteQuiz = async (req: Request, res: Response) => {
try{
    const {quizId} = req.params;

    const quiz = await Quiz.findById(quizId)
    .populate('createdBy')
    .populate('assignment')
    .populate({
        path: 'assignment',
        populate: {
            path: 'questions',
            model: 'Question'
        }
    });

    if(!quiz){
        return res.status(400).json({success : false , error: 'Quiz not found' });
    }

    return res.status(200).json({
        success: true,
        quiz,
    });

} catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
        message: 'Internal Server error',
    });
  }
};

export const getSingleQuiz = async (req: Request, res: Response) => {
    try {
        const {quizId} = req.params;

        const quiz = await Quiz.findById(quizId)
        .populate('leaderboard')
        .populate('createdBy')
        .populate('assignment')
        .populate('assignment');

        if(!quiz){
            return res.status(400).json({success : false , error: 'Quiz not found' });
        }

        return res.status(200).json({
            success: true,
            quiz,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server error',
        });
    }
};

export const createQuiz = async (req: Request, res: Response) => {
    try{
        const {
            name,
            description,
            createdBy,
            language
        } = req.body;

        const image = req.body?.image || null;
        
        if(!name || !description || !createdBy || !language){
            return res.status(400).json({success : false , error: 'Please enter all fields' });
        }

        const user = await User.findById(createdBy);
        let verified = false;

        if(user?.accountType == 'admin'){
            verified = true;
        }

        const quiz = await Quiz.create({
            name,
            description,
            createdBy,
            language,
            verified,
            image
        });

        user?.quizes.push(quiz._id);

        await user?.save();


        return res.status(200).json({
            success: true,
            quiz,
        });

    } catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server error',
        });
    }
}

export const createAssignment = async (req: Request, res: Response) => {
    try{
        const {
            name,
            description,
        } = req.body;

        if(!name || !description){
            return res.status(400).json({success : false , error: 'Please enter all fields' });
        }

        const assignment = await Assignment.create({
            name,
            description,
            instructions: req.body?.instructions || null,
        });

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.quizId,
            { $push: { assignment: assignment._id } },
            { new: true }
          );
          

        return res.status(200).json({
            success: true,
            assignment,
        });

    } catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server error',
        });
    }
};

export const createQuestion = async (req: Request, res: Response) => {
    try{
        const {
            question,
            options,
            answer,
            points
        } = req.body;

        
        if(!question || !options || !answer || !points){
            return res.status(400).json({success : false , error: 'Please enter all fields' });
        }

        const saveQuestion = await Question.create({
            question,
            options,
            answer,
            points
        });

        const SaveToAssignment = await Assignment.findByIdAndUpdate(req.params.assignmentId, {
            $push: { questions: saveQuestion._id } }, {new : true}
        );
                                
        return res.status(200).json({
            success: true,
            saveQuestion,
        });

    } catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server error',
        });
    }
}

export const submitQuiz = async (req: AuthReq, res: Response) => {
    try{
        const {answers , timeRemaining } = req.body;

        const {quizId} = req.params;

        if(!answers || !timeRemaining){
            return res.status(400).json({success : false , error: 'Please enter all fields' });
        }

        let totalscore : number = 0;

        for(const key in answers){
            const question = await Question.findById(new mongoose.Types.ObjectId(key));
            console.log(question)
            if(question?.answer === answers[key].toString()){
                totalscore += question!.points;
            }
        }

        totalscore = Math.floor(totalscore * timeRemaining / 1000);

        const quizAttempt = await QuizAttempt.create({
            quiz: quizId,
            user: req.user.id,
            totalscore
        });

        const updateUser = await User.findByIdAndUpdate(req.user.id, {
            $push: { quizAttempts: quizAttempt._id } }, {new : true}
        );

        const updateQuiz = await Quiz.findByIdAndUpdate(quizId, {
            $push: { leaderboard: quizAttempt._id } }, {new : true}
        );


        console.log(totalscore)

        res.status(200).json({
            success: true,
            message: 'Quiz submitted successfully',
            quizAttempt,
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server error',
        });
    }
}

export const getLeaderboard = async (req: Request, res: Response) => {
    try{
        const {quizId} = req.params;

        const leaderboard = await Quiz.findById(quizId).populate({
            path: 'leaderboard',
            populate: {
                path: 'user',
                select: 'username'
            }
        });

        if(!leaderboard){
            return res.status(400).json({success : false , error: 'No Leaderbaord' });
        }

        return res.status(200).json({
            success: true,
            leaderboard,
        });

    } catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server error',
        });
    }
}