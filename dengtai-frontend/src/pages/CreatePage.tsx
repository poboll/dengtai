import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./CreatePage.module.css";

const CreatePage = () => {
  return (
    <AppLayout
      header={
        <MainHeader
          headline="创建新内容"
          subtitle="分享你的知识，让更多人受益"
          rightSlot={<AuthStatus />}
        />
      }
    >
      <div className={styles.formCard}>
        <SectionHeader title="基本信息" subtitle="精准描述你的内容，帮助同学快速了解" />
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">
              标题 *
            </label>
            <input id="title" className={styles.input} placeholder="输入内容标题" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="type">
              内容类型 *
            </label>
            <select id="type" className={styles.select} defaultValue="图文笔记">
              <option value="图文笔记">图文笔记</option>
              <option value="视频课程">视频课程</option>
              <option value="音频课程">音频课程</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="category">
              分类 *
            </label>
            <select id="category" className={styles.select} defaultValue="编程开发">
              <option value="编程开发">编程开发</option>
              <option value="设计灵感">设计灵感</option>
              <option value="商业增长">商业增长</option>
              <option value="语言学习">语言学习</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="series">
              关联专栏
            </label>
            <select id="series" className={styles.select} defaultValue="">
              <option value="">选择一个专栏</option>
              <option value="coding">AI Coding 体验之旅</option>
              <option value="product">产品实践工作坊</option>
            </select>
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.label}>图片（多选） *</label>
            <div className={styles.uploadBox}>
              <span>拖拽或点击上传图片</span>
              <small>支持 JPG / PNG / SVG，单张不超过 5MB</small>
            </div>
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.label} htmlFor="content">
              内容正文 *
            </label>
            <textarea id="content" className={styles.textarea} placeholder="写下你的知识内容..." />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.label} htmlFor="product">
              关联商品（用于引导购内容）
            </label>
            <input id="product" className={styles.input} placeholder="商品标题" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="product-price">
              价格
            </label>
            <input id="product-price" className={styles.input} type="number" min="0" step="0.1" defaultValue="0" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tags">
              标签
            </label>
            <input id="tags" className={styles.input} placeholder="输入标签按回车添加" />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <div className={styles.toggle}>
              <div>
                <div className={styles.label}>免费分享</div>
                <small>免费内容将用于引流，可关联付费商品</small>
              </div>
              <div className={styles.switch} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.submit}>
            发布
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreatePage;
