import { useState } from 'react';
import { 
  Play, 
  Clock, 
  Star, 
  ChevronRight, 
  BookOpen, 
  Code2, 
  Palette, 
  Database,
  Globe,
  Zap,
  Trophy,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  icon: React.ElementType;
  color: string;
  lessons: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  progress?: number;
}

const courses: Course[] = [
  {
    id: 'html-basics',
    title: 'HTML Basics',
    titleBn: 'এইচটিএমএল বেসিক',
    description: 'Learn the fundamentals of HTML to structure web pages',
    descriptionBn: 'ওয়েব পেজ তৈরির জন্য HTML এর মূল বিষয়গুলো শিখুন',
    icon: Globe,
    color: 'from-orange-500 to-red-500',
    lessons: 12,
    duration: '2h 30m',
    level: 'beginner',
    progress: 45,
  },
  {
    id: 'css-styling',
    title: 'CSS Styling',
    titleBn: 'সিএসএস স্টাইলিং',
    description: 'Style your websites with modern CSS techniques',
    descriptionBn: 'আধুনিক CSS টেকনিক দিয়ে আপনার ওয়েবসাইট সাজান',
    icon: Palette,
    color: 'from-blue-500 to-purple-500',
    lessons: 15,
    duration: '3h 15m',
    level: 'beginner',
  },
  {
    id: 'javascript-intro',
    title: 'JavaScript Introduction',
    titleBn: 'জাভাস্ক্রিপ্ট পরিচিতি',
    description: 'Add interactivity to your web pages with JavaScript',
    descriptionBn: 'জাভাস্ক্রিপ্ট দিয়ে আপনার ওয়েব পেজে ইন্টারঅ্যাক্টিভিটি যোগ করুন',
    icon: Code2,
    color: 'from-yellow-500 to-orange-500',
    lessons: 20,
    duration: '4h 45m',
    level: 'beginner',
  },
  {
    id: 'python-basics',
    title: 'Python Fundamentals',
    titleBn: 'পাইথন ফান্ডামেন্টালস',
    description: 'Start your programming journey with Python',
    descriptionBn: 'পাইথন দিয়ে আপনার প্রোগ্রামিং যাত্রা শুরু করুন',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    lessons: 25,
    duration: '5h 30m',
    level: 'beginner',
  },
  {
    id: 'react-basics',
    title: 'React Basics',
    titleBn: 'রিঅ্যাক্ট বেসিক',
    description: 'Build modern user interfaces with React',
    descriptionBn: 'React দিয়ে আধুনিক ইউজার ইন্টারফেস তৈরি করুন',
    icon: Code2,
    color: 'from-cyan-500 to-blue-500',
    lessons: 18,
    duration: '4h 00m',
    level: 'intermediate',
  },
  {
    id: 'database-intro',
    title: 'Database Fundamentals',
    titleBn: 'ডাটাবেস ফান্ডামেন্টালস',
    description: 'Learn how to store and manage data',
    descriptionBn: 'ডাটা সংরক্ষণ ও ব্যবস্থাপনা শিখুন',
    icon: Database,
    color: 'from-purple-500 to-pink-500',
    lessons: 14,
    duration: '3h 00m',
    level: 'intermediate',
  },
];

const levelColors = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

const levelLabels = {
  beginner: 'শুরু',
  intermediate: 'মাঝারি',
  advanced: 'উন্নত',
};

export const LearnPage = () => {
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(c => c.level === filter);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Learn</h1>
              <p className="text-sm text-muted-foreground">শিখুন এবং প্র্যাকটিস করুন</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            এখানে আপনি বিভিন্ন প্রোগ্রামিং ভাষা শিখতে পারবেন। প্রতিটি কোর্সে ছোট ছোট লেসন আছে এবং 
            সাথে সাথেই কোড লিখে প্র্যাকটিস করতে পারবেন।
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">6</div>
                <div className="text-xs text-muted-foreground">কোর্স উপলব্ধ</div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">23h+</div>
                <div className="text-xs text-muted-foreground">মোট কন্টেন্ট</div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">10K+</div>
                <div className="text-xs text-muted-foreground">শিক্ষার্থী</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <Button
              key={level}
              variant={filter === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(level)}
              className="capitalize"
            >
              {level === 'all' ? 'সব' : levelLabels[level]}
            </Button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer group"
            >
              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                course.color
              )}>
                <course.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{course.title}</h3>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", levelColors[course.level])}>
                    {levelLabels[course.level]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{course.titleBn}</p>
                <p className="text-sm text-muted-foreground">{course.descriptionBn}</p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {course.lessons} লেসন
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {course.duration}
                </span>
              </div>

              {/* Progress or Start */}
              {course.progress ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">অগ্রগতি</span>
                    <span className="text-primary">{course.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Button 
                  className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                  variant="outline"
                  size="sm"
                >
                  <Play className="w-4 h-4" />
                  শুরু করুন
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
