/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpeechText } from '../components/speach';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Clock, Calendar, CheckCircle, PlayCircle, Search, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Course {
  title: string;
  description: string;
  status: "Completed" | "Upcoming" | "Watching";
  duration: string;
  progress?: string;
  category: string;
}

interface Event {
  type: "Webinar" | "Lesson" | "Task";
  title: string;
  description: string;
  date: string;
  time?: string;
}

interface Resource {
  title: string;
  type: "Article" | "Video" | "Tip";
  link?: string;
  description: string;
}

const learningPlan: Course[] = [
  { title: "ADHD Fundamentals", description: "Explore the basics of ADHD and strategies for managing attention and focus.", status: "Completed", duration: "00:45", category: "Cognitive" },
  { title: "Time Management for ADHD", description: "Learn practical techniques to organize tasks and manage time effectively with ADHD.", status: "Watching", duration: "00:40", progress: "00:20", category: "Cognitive" },
  { title: "ADHD and Emotional Regulation", description: "Understand emotional challenges with ADHD and develop coping skills.", status: "Upcoming", duration: "00:35", category: "Mental Health" },
  { title: "Dyslexia Reading Strategies", description: "Master techniques to improve reading fluency and comprehension.", status: "Completed", duration: "00:50", category: "Reading" },
  { title: "Autism and Social Communication", description: "Build skills for effective social interaction and understanding cues.", status: "Upcoming", duration: "00:30", category: "Social" },
  { title: "Motor Skills Development", description: "Enhance coordination and fine motor skills through targeted exercises.", status: "Watching", duration: "00:25", progress: "00:15", category: "Motor Skills" },
  { title: "Understanding Dyscalculia", description: "Learn about math-related challenges and strategies to overcome them.", status: "Upcoming", duration: "00:40", category: "Mathematics" },
  { title: "OCD Coping Mechanisms", description: "Develop tools to manage obsessive-compulsive behaviors effectively.", status: "Completed", duration: "00:35", category: "Psychological" },
  { title: "Bipolar Disorder Basics", description: "Gain insights into bipolar disorder and mood management techniques.", status: "Upcoming", duration: "00:45", category: "Mental Health" },
  { title: "Sensory Processing Skills", description: "Explore sensory sensitivities and ways to adapt daily routines.", status: "Watching", duration: "00:30", progress: "00:10", category: "Perception" },
  { title: "Down Syndrome Learning Strategies", description: "Discover tailored approaches to support learning with Down Syndrome.", status: "Upcoming", duration: "00:50", category: "Genetic" },
  { title: "Anatomy and Physiology", description: "Understand the structure and function of the human body.", status: "Completed", duration: "00:30", category: "Reading" },
  { title: "Pharmacology Basics", description: "Learn basic medical language for effective communication.", status: "Watching", duration: "00:30", progress: "00:30", category: "Social" },
  { title: "Medical Ethics and Professionalism", description: "Understand ethical principles and professionalism in healthcare.", status: "Upcoming", duration: "00:30", category: "Neurological" },
  { title: "Disease Pathophysiology", description: "Study the cellular and molecular basis of common diseases.", status: "Upcoming", duration: "00:30", category: "Motor Skills" },
];

const events: Event[] = [
  { type: "Webinar", title: "Understanding medical research, critical appraisal skills, and applying evidence-based guidelines in practice", description: "", date: "Tu, 25.03", time: "12:30" },
  { type: "Lesson", title: "Overview of healthcare delivery systems, health policy, and their impact on patient care.", description: "", date: "We, 26.03" },
  { type: "Task", title: "Examination of major global health issues, including infectious diseases, non-communicable diseases, and healthcare disparities.", description: "", date: "Th, 27.03" },
  { type: "Task", title: "Importance of teamwork and communication among healthcare professionals for optimal patient outcomes.", description: "", date: "Fr, 28.03" },
];

const categoryContent: Record<string, { description: string; resources: Resource[] }> = {
  "All": {
    description: "Explore a wide range of neurodiversity topics covering cognitive, social, motor skills, and more, designed to empower learners with diverse needs.",
    resources: [
      { title: "What is Neurodiversity?", type: "Article", link: "https://www.neurodiversityhub.org/what-is-neurodiversity", description: "An overview of neurodiversity and its importance in education and society." },
      { title: "Neurodiversity Explained", type: "Video", link: "https://www.youtube.com/watch?v=jKB2ulrHh0s", description: "A concise video breaking down the concept of neurodiversity." },
      { title: "Inclusive Learning Tip", type: "Tip", description: "Adapt lessons to individual strengths for better engagement and understanding." },
    ],
  },
  "Cognitive": {
    description: "Learn about cognitive conditions like ADHD that affect attention, focus, and executive functioning, with strategies to enhance cognitive skills.",
    resources: [
      { title: "ADHD Coping Strategies", type: "Article", link: "https://www.additudemag.com/adhd-coping-skills/", description: "Practical tips for managing ADHD symptoms in daily life." },
      { title: "ADHD Basics", type: "Video", link: "https://www.youtube.com/watch?v=hFL6qRIJZ_Y", description: "Understand the fundamentals of ADHD and its impact on learning." },
      { title: "Focus Techniques", type: "Tip", description: "Use timers and breaks to maintain concentration during tasks." },
    ],
  },
  // ... (other categories remain the same)
};

const Learning: React.FC = () => {
  const { user } = useAuth();
  const db = getFirestore();
  const location = useLocation();
  const [completion, setCompletion] = useState<{ [key: string]: number }>({});
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          let enrolledFromFirebase: string[] = [];
          let completionFromFirebase: { [key: string]: number } = {};
          let predictedCategoryFromFirebase: string = "All";

          if (userDoc.exists()) {
            const data = userDoc.data();
            enrolledFromFirebase = data.enrolled || [];
            completionFromFirebase = data.completion || {};
            predictedCategoryFromFirebase = data.predictedCategory || "All";
          }

          setEnrolledCourses(new Set(enrolledFromFirebase));
          setCompletion(completionFromFirebase);
          const predictedCategoryFromState = (location.state as { predictedCategory?: string })?.predictedCategory;
          const finalPredictedCategory = predictedCategoryFromState || predictedCategoryFromFirebase;
          setSelectedCategory(finalPredictedCategory);

          if (finalPredictedCategory !== "All") {
            const recommendedCourse = learningPlan.find(course => course.category === finalPredictedCategory);
            if (recommendedCourse && !enrolledFromFirebase.includes(recommendedCourse.title)) {
              const newEnrolled = new Set([...enrolledFromFirebase, recommendedCourse.title]);
              setEnrolledCourses(newEnrolled);
              const newCompletion = { ...completionFromFirebase, [recommendedCourse.title]: 0 };
              setCompletion(newCompletion);
              await setDoc(userDocRef, { enrolled: Array.from(newEnrolled), completion: newCompletion }, { merge: true });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setSelectedCategory("All");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, db, location.state]);

  const updateUserData = async (newEnrolled: Set<string>, newCompletion: { [key: string]: number }) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { enrolled: Array.from(newEnrolled), completion: newCompletion }, { merge: true });
      } catch (error) {
        console.error("Error updating user data:", error);
      }
    }
  };

  const handleEnroll = async (courseTitle: string) => {
    const newEnrolled = new Set(enrolledCourses);
    let newCompletion = { ...completion };

    if (newEnrolled.has(courseTitle)) {
      newEnrolled.delete(courseTitle);
      delete newCompletion[courseTitle];
    } else {
      newEnrolled.add(courseTitle);
      newCompletion[courseTitle] = 0;
    }

    setEnrolledCourses(newEnrolled);
    setCompletion(newCompletion);
    await updateUserData(newEnrolled, newCompletion);
  };

  const openPopup = (url: string) => {
    // Convert YouTube URL to embed format
    let embedUrl = url;
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    } else if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop()?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }
    setVideoUrl(embedUrl);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setVideoUrl(null);
  };

  const filteredCourses = learningPlan.filter(course =>
    (selectedCategory === "All" || course.category === selectedCategory) &&
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    hover: { scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  const relatedContentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const popupVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: "easeIn" } },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 1, ease: "easeInOut", delay: 0.5 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, backgroundColor: "#16a34a", transition: { duration: 0.3, ease: "easeInOut" } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
  };

  const searchBarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SpeechText>Loading...</SpeechText>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div variants={searchBarVariants} initial="hidden" animate="visible" className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </motion.div>

            <motion.div className="flex justify-between items-center mb-6" variants={cardVariants}>
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                <SpeechText>My Learning Plan</SpeechText>
                <Clock className="h-5 w-5 ml-2 text-gray-500" />
              </h2>
              <div className="flex space-x-4">
                <motion.div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <span className="font-bold">{filteredCourses.length}</span> Total
                </motion.div>
                <motion.div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <span className="font-bold">{filteredCourses.filter(c => c.status === "Completed").length}</span> Completed
                </motion.div>
                <motion.div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <span className="font-bold">{filteredCourses.filter(c => c.status === "Upcoming").length}</span> Upcoming
                </motion.div>
              </div>
            </motion.div>

            <div className="relative">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <div key={index} className="relative mb-6">
                    {index < filteredCourses.length - 1 && (
                      <motion.svg className="absolute left-6 top-16 h-24 w-0" initial="hidden" animate="visible">
                        <motion.line x1="0" y1="0" x2="0" y2="96" stroke="#d1d5db" strokeWidth="2" strokeDasharray="4 4" variants={lineVariants} />
                      </motion.svg>
                    )}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className={`bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 ${course.status === "Watching" ? "bg-purple-50" : ""}`}
                    >
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                        {course.status === "Completed" ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : course.status === "Watching" ? (
                          <PlayCircle className="h-8 w-8 text-purple-500" />
                        ) : (
                          <Calendar className="h-8 w-8 text-gray-400" />
                        )}
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          <SpeechText>{course.title}</SpeechText>
                        </h3>
                        <p className="text-gray-600 text-sm">
                          <SpeechText>{course.description}</SpeechText>
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-gray-500 text-sm">
                            <SpeechText>{course.status}</SpeechText>
                          </span>
                          {course.status === "Watching" && (
                            <span className="text-gray-500 text-sm">
                              <SpeechText>Watching {course.progress}</SpeechText>
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleEnroll(course.title)}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${enrolledCourses.has(course.title) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                      >
                        <SpeechText>{enrolledCourses.has(course.title) ? "Unenroll" : "Enroll Now"}</SpeechText>
                      </motion.button>
                    </motion.div>

                    <AnimatePresence>
                      {enrolledCourses.has(course.title) && (
                        <motion.div variants={relatedContentVariants} initial="hidden" animate="visible" exit="exit" className="mt-4 ml-16">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            <SpeechText>Related Content for {course.title}</SpeechText>
                          </h4>
                          <div className="space-y-4">
                            {categoryContent[course.category]?.resources.map((resource, resIndex) => (
                              <motion.div
                                key={resIndex}
                                variants={cardVariants}
                                whileHover="hover"
                                className={`rounded-xl shadow-md p-4 ${resource.type === "Article" ? "bg-green-50" : resource.type === "Video" ? "bg-blue-50" : "bg-yellow-50"}`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-semibold text-gray-700">
                                    <SpeechText>{resource.type}</SpeechText>
                                  </span>
                                </div>
                                <h5 className="text-md font-semibold text-gray-800">
                                  <SpeechText>{resource.title}</SpeechText>
                                </h5>
                                <p className="text-gray-600 text-sm mt-1">
                                  <SpeechText>{resource.description}</SpeechText>
                                </p>
                                {resource.link && (
                                  resource.type === "Video" ? (
                                    <motion.button
                                      onClick={() => openPopup(resource.link!)}
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      className="mt-2 inline-block px-4 py-1 bg-blue-600 text-white rounded-lg text-sm"
                                    >
                                      <SpeechText>Watch Video</SpeechText>
                                    </motion.button>
                                  ) : (
                                    <motion.a
                                      href={resource.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      className="mt-2 inline-block px-4 py-1 bg-blue-600 text-white rounded-lg text-sm"
                                    >
                                      <SpeechText>Learn More</SpeechText>
                                    </motion.a>
                                  )
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-center text-gray-600">
                  <SpeechText>No courses found matching your search or category.</SpeechText>
                </motion.div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 variants={cardVariants} className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <SpeechText>My Events</SpeechText>
                <span className="ml-2">🎉</span>
              </motion.h2>
              <div className="space-y-4">
                <AnimatePresence>
                  {events.map((event, index) => (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: 20 }}
                      whileHover="hover"
                      className={`rounded-xl shadow-md p-4 ${event.type === "Webinar" ? "bg-blue-50" : event.type === "Lesson" ? "bg-purple-50" : "bg-yellow-50"}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          <SpeechText>{event.type}</SpeechText>
                        </span>
                        <span className="text-sm text-gray-600">
                          <SpeechText>{event.date}</SpeechText>
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        <SpeechText>{event.title}</SpeechText>
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          <SpeechText>{event.description}</SpeechText>
                        </p>
                      )}
                      {event.time && (
                        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" className="mt-2 px-4 py-1 bg-gray-200 text-gray-800 rounded-lg text-sm">
                          <SpeechText>Start at {event.time}</SpeechText>
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <motion.h2 variants={cardVariants} className="text-2xl font-semibold text-gray-800 mt-8 mb-6 flex items-center">
                <SpeechText>Resources</SpeechText>
                <span className="ml-2">📚</span>
              </motion.h2>
              <div className="space-y-4">
                <AnimatePresence>
                  {categoryContent[selectedCategory]?.resources.map((resource, index) => (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: 20 }}
                      whileHover="hover"
                      className={`rounded-xl shadow-md p-4 ${resource.type === "Article" ? "bg-green-50" : resource.type === "Video" ? "bg-blue-50" : "bg-yellow-50"}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          <SpeechText>{resource.type}</SpeechText>
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        <SpeechText>{resource.title}</SpeechText>
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        <SpeechText>{resource.description}</SpeechText>
                      </p>
                      {resource.link && (
                        resource.type === "Video" ? (
                          <motion.button
                            onClick={() => openPopup(resource.link!)}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="mt-2 inline-block px-4 py-1 bg-blue-600 text-white rounded-lg text-sm"
                          >
                            <SpeechText>Watch Video</SpeechText>
                          </motion.button>
                        ) : (
                          <motion.a
                            href={resource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="mt-2 inline-block px-4 py-1 bg-blue-600 text-white rounded-lg text-sm"
                          >
                            <SpeechText>Learn More</SpeechText>
                          </motion.a>
                        )
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isPopupOpen && (
            <>
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={closePopup}
              >
                <motion.div
                  variants={popupVariants}
                  className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
                    {videoUrl && (
                      <iframe
                        src={videoUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video Player"
                      />
                    )}
                  </div>
                  <motion.button
                    onClick={closePopup}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 shadow-lg z-10"
                    aria-label="Close video"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Learning;