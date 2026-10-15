"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import ProtectedRoute from "@/components/UI/protectedRoutes";

interface Course {
  _id: string;
  title: string;
  instructor: string;
  description: string;
  youtubelink: string;
  createdAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    instructor: "",
    description: "",
    youtubelink: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await API.get("/courses");
      setCourses(res.data.data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateCourseForm = () => {
    const errors: string[] = [];
    
    if (!form.title.trim()) {
      errors.push("Course title is required");
    } else if (form.title.trim().length < 3) {
      errors.push("Course title must be at least 3 characters");
    }
    
    if (!form.instructor.trim()) {
      errors.push("Instructor name is required");
    }
    
    if (!form.description.trim()) {
      errors.push("Course description is required");
    } else if (form.description.trim().length < 10) {
      errors.push("Description must be at least 10 characters");
    }
    
    if (form.youtubelink && form.youtubelink.trim()) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
      if (!youtubeRegex.test(form.youtubelink)) {
        errors.push("Please provide a valid YouTube URL");
      }
    }
    
    return errors;
  };

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateCourseForm();
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(". ");
      alert("Validation Error:\n" + errorMessage);
      return;
    }
    
    try {
      await API.post("/courses", form);
      
      // Success feedback
      const successEl = document.createElement('div');
      successEl.className = "fixed top-4 right-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 z-50 animate-in fade-in";
      successEl.innerHTML = `
        <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <p class="text-green-400 text-sm font-medium">Course added successfully!</p>
      `;
      document.body.appendChild(successEl);
      setTimeout(() => successEl.remove(), 3000);
      
      setForm({ title: "", instructor: "", description: "", youtubelink: "" });
      loadCourses();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("[v0] Error adding course:", error);
      
      let errorMessage = "Failed to add course. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
      }
      
      alert("Error: " + errorMessage);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await API.delete(`/courses/${id}`);
      loadCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const extractVideoId = (url: string) => {
    if (!url) return "";
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/,
    );
    return match ? match[1] : "";
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              NCC Training Courses
            </h1>
            <p className="text-gray-400">
              Manage training materials and resources
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-400 mt-4 rounded-full" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-lg flex items-center justify-center mr-4 border border-green-700/30">
                  <span className="text-2xl font-bold text-green-400">📚</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    Total Courses
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {courses.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-lg flex items-center justify-center mr-4 border border-green-700/30">
                  <span className="text-2xl font-bold text-green-400">🎥</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    Video Resources
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {courses.filter((c) => c.youtubelink).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-lg flex items-center justify-center mr-4 border border-green-700/30">
                  <span className="text-2xl font-bold text-green-400">👨‍🏫</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    Instructors
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {[...new Set(courses.map((c) => c.instructor))].length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search courses, instructors, or topics..."
                  className="w-full bg-gray-800/50 border border-green-900/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-500 transition-all"
              >
                + New Course
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-400">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-green-900/30">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <p className="text-gray-400 text-lg mb-2">No courses found</p>
              <p className="text-gray-500 mb-6">
                Add your first course to get started!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl"
              >
                + Add First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className="bg-gray-900/70 border border-green-900/30 rounded-2xl overflow-hidden hover:border-green-500/50 transition-all group"
                >
                  {/* Video Thumbnail */}
                  {course.youtubelink && (
                    <div className="relative aspect-video bg-gray-800">
                      <img
                        src={`https://img.youtube.com/vi/${extractVideoId(course.youtubelink)}/hqdefault.jpg`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={course.youtubelink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-all transform hover:scale-110"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Course Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white line-clamp-2">
                        {course.title}
                      </h3>
                      <button
                        onClick={() => deleteCourse(course._id)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center text-gray-400 mb-4">
                      <svg
                        className="w-5 h-5 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-medium">{course.instructor}</span>
                    </div>

                    <p className="text-gray-300 mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                      {course.youtubelink && (
                        <a
                          href={course.youtubelink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                          </svg>
                          Watch
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Course Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-green-900/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Add New Course
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={addCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Title *
                  </label>
                  <input
                    placeholder="e.g., Basic Military Training"
                    className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instructor *
                  </label>
                  <input
                    placeholder="e.g., Major R. Kumar"
                    className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                    value={form.instructor}
                    onChange={(e) =>
                      setForm({ ...form, instructor: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    YouTube Link
                  </label>
                  <input
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                    value={form.youtubelink}
                    onChange={(e) =>
                      setForm({ ...form, youtubelink: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - For video resources
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder="Describe the course content, objectives, and requirements..."
                    className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border border-green-900/30 text-gray-300 rounded-xl p-3 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-700 to-emerald-600 text-white font-semibold rounded-xl p-3 hover:from-green-600 hover:to-emerald-500"
                  >
                    Add Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
