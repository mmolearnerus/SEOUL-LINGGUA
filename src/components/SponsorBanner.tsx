import React, { useState } from "react";
import { Award, BookOpen, GraduationCap, Phone, MapPin, Send, CheckCircle2, Star, Percent } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const SponsorBanner: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", phone: "", course: "IELTS" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setLoading(true);
    // Simulate API registration call
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      // Save leads locally for the demo
      const savedLeads = JSON.parse(localStorage.getItem("seoul_center_leads") || "[]");
      savedLeads.push({ ...formData, registeredAt: new Date().toISOString() });
      localStorage.setItem("seoul_center_leads", JSON.stringify(savedLeads));
    }, 1200);
  };

  const programs = [
    { name: "Luyện thi IELTS", desc: "Cam kết đầu ra 6.5+ bằng văn bản, giáo viên bản xứ", tag: "Hot" },
    { name: "Tiếng Anh Giao Tiếp", desc: "Môi trường 100% tiếng Anh, phản xạ tự nhiên sau 3 tháng", tag: "Popular" },
    { name: "Tiếng Anh Trẻ Em", desc: "Học qua dự án sáng tạo và trò chơi tương tác chuẩn Cambridge", tag: "Kids" },
    { name: "Tiếng Hàn (TOPIK)", desc: "Đội ngũ Thạc sĩ Hàn Quốc, cam kết đỗ TOPIK II cấp tốc", tag: "Seoul Choice" },
  ];

  return (
    <div id="seoul-sponsor-section" className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-indigo-500/20 my-8">
      {/* Upper Brand Bar */}
      <div className="px-6 py-8 md:p-10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-xs font-semibold tracking-wider uppercase">
              <Star className="w-3.5 h-3.5 fill-red-400 text-red-400 animate-pulse" />
              Đơn Vị Đồng Hành Chiến Lược
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              TRUNG TÂM NGOẠI NGỮ <span className="bg-gradient-to-r from-red-400 via-amber-300 to-indigo-300 bg-clip-text text-transparent">SEOUL</span>
            </h2>
            
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Hệ thống đào tạo ngôn ngữ chuẩn quốc tế, giúp thế hệ trẻ Việt Nam tự tin làm chủ ngôn ngữ, bứt phá giới hạn bản thân để tự tin bước ra thế giới.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span>100% GV bằng Sư Phạm quốc tế</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Award className="w-4 h-4" />
                </div>
                <span>Cam kết chuẩn đầu ra văn bản</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Giáo trình chuẩn Cambridge</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Percent className="w-4 h-4" />
                </div>
                <span>Ưu đãi 15% học phí độc quyền</span>
              </div>
            </div>
          </div>

          {/* Special discount offer card */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/15 lg:w-96 shrink-0 shadow-lg">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                >
                  <div className="text-center space-y-1 mb-2">
                    <span className="text-xs text-amber-400 font-bold tracking-widest uppercase">
                      Đăng Ký Tư Vấn Nhận Quà
                    </span>
                    <h3 className="font-bold text-lg text-white">Giảm Ngay 15% Học Phí</h3>
                    <p className="text-xs text-slate-300">Đăng ký giữ chỗ miễn phí ngay hôm nay</p>
                  </div>

                  <div className="space-y-3">
                    <input
                      id="seoul-reg-name"
                      type="text"
                      placeholder="Họ và tên của bạn"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <input
                      id="seoul-reg-phone"
                      type="tel"
                      placeholder="Số điện thoại liên hệ"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <select
                      id="seoul-reg-course"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="IELTS">Luyện thi IELTS (Cam kết 6.5+)</option>
                      <option value="English Com">Tiếng Anh Giao Tiếp Phản Xạ</option>
                      <option value="Kids English">Tiếng Anh Trẻ Em (Cambridge)</option>
                      <option value="TOPIK">Tiếng Hàn Học Thuật & TOPIK</option>
                    </select>
                  </div>

                  <button
                    id="seoul-reg-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-indigo-600 hover:from-red-600 hover:to-indigo-700 text-white text-sm font-bold shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Nhận Ưu Đãi & Đăng Ký Học Thử
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-emerald-400">Đăng Ký Thành Công!</h3>
                    <p className="text-xs text-slate-200">
                      Cảm ơn <strong>{formData.name}</strong>, bộ phận tuyển sinh của <strong>Ngoại Ngữ Seoul</strong> sẽ liên hệ hỗ trợ bạn sau vài phút!
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-[11px] text-emerald-300">
                    Mã Ưu Đãi Của Bạn: <strong className="font-mono text-sm block tracking-widest text-white mt-1">SEOUL-LEARN-15%</strong>
                  </div>
                  <button
                    id="seoul-reg-reset"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: "", phone: "", course: "IELTS" });
                    }}
                    className="text-xs text-slate-300 hover:text-white underline"
                  >
                    Đăng ký cho học viên khác
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Programs Showroom */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Các chương trình đào tạo tiêu biểu:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {programs.map((program, index) => (
              <div 
                key={index} 
                className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-indigo-500/30 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-indigo-300">{program.name}</span>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded-full font-semibold">
                    {program.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{program.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer address info */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Địa chỉ: 210 Lý Nam Đế, Phổ Yên, Thái Nguyên</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Hotline / Zalo: 0973.666.134 - 0382.068.869</span>
          </div>
        </div>
      </div>
    </div>
  );
};
