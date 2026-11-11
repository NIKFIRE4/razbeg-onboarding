export type Role = 'employee'|'hr'|'mentor';
export type Track = 'warehouse'|'store'|'sales'|'office';
export type Format = 'remote'|'onsite'|'hybrid'|'unknown';
export interface Step {id:string; title:string; detail:string; stage:string; basis:string}
export interface Question {id:string; text:string; basis:string}
export interface Template {id:string; name:string; track:Track; format:Format; version:number; goal:string; mentor:string; steps:Step[]; questions:Question[]; source:string; notes:string; experience:string; approved:boolean}
export interface Checkin {id:string;at:string;stage:string;answers:{questionId:string;question?:string;value:string}[];comment:string}
export interface Employee {id:string;name:string;role:string;templateId:string;day:number;startDate:string;mentor:string;hr:string;completed:string[];checkins:Checkin[]}
export interface Message {id:string;author:string;text:string;at:string}
export interface Request {id:string;employeeId:string;category:string;text:string;recipient:'hr'|'mentor';status:'new'|'progress'|'waiting'|'resolved';createdAt:string;updatedAt:string;action:string;owner:string;due:string;messages:Message[];triedArticleIds:string[];linkedArticleId:string|null}
export interface Article {id:string;track:Track|'all';title:string;answer:string;keywords:string;status:'draft'|'published';helpful:number;notHelpful:number;updatedAt:string;source:string;sourceRequestId:string|null}
export interface Inquiry {id:string;employeeId:string;question:string;articleId:string|null;outcome:string;at:string;requestId?:string}
export interface State {revision:number;templates:Template[];employees:Employee[];requests:Request[];articles:Article[];inquiries:Inquiry[];sources:{title:string;url:string;detail:string}[]}
