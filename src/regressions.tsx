import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Plus,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Button, Empty, Modal, money } from "./components";
import { useApp } from "./context";
import { Student, StudentStatus } from "./types";
import { RecurringForm } from "./advanced";
import { studentBalance } from "./services/scheduleService";
const today = () => new Date().toISOString().slice(0, 10),
  initials = (s: string) =>
    s
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2),
  monthNames = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ];
function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="stat">
      <span className={tone}>{icon}</span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
    </div>
  );
}
export function RestoredDashboard() {
  const { data, setData, notify } = useApp(),
    date = today(),
    lessons = data.lessons
      .filter((l) => l.date === date)
      .sort((a, b) => a.time.localeCompare(b.time)),
    month = date.slice(0, 7),
    income = data.payments
      .filter((p) => p.date.startsWith(month))
      .reduce((a, p) => a + p.amount, 0),
    debt = data.students.reduce(
      (a, s) => a + Math.max(0, -studentBalance(data, s.id)),
      0,
    );
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);
  const week = data.lessons.filter((l) => {
      const d = new Date(l.date + "T12:00");
      return d >= monday && d < sunday;
    }),
    done = week.filter((l) => l.status === "done").length,
    pct = week.length ? Math.round((done / week.length) * 100) : 0;
  const mark = (id: string) => {
    setData((d) => ({
      ...d,
      lessons: d.lessons.map((l) =>
        l.id === id ? { ...l, status: "done" } : l,
      ),
    }));
    notify("Занятие отмечено проведённым");
  };
  const attention = [
    ...data.notifications.map((n) => ({
      title: n.text,
      sub: "",
      kind: n.kind,
    })),
    ...(data.students
      .map((s) => {
        const b = studentBalance(data, s.id);
        return b
          ? {
              title: s.name,
              sub:
                b < 0
                  ? `Не оплачено — ${money(-b)}`
                  : `Перенос ${money(b)} на следующий месяц`,
              kind: b < 0 ? "danger" : "success",
            }
          : null;
      })
      .filter(Boolean) as { title: string; sub: string; kind: string }[]),
  ];
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">Рабочий стол</span>
        <h1>Доброе утро, {data.profile.name.split(" ")[0]}! 👋</h1>
        <p>
          {new Date().toLocaleDateString("ru-RU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          · Всё важное на сегодня
        </p>
      </div>
      <div className="stats">
        <Stat
          icon={<Calendar />}
          label="Занятия сегодня"
          value={`${lessons.length} занятия`}
          tone="violet"
        />
        <Stat
          icon={<Users />}
          label="Ученики"
          value={`${data.students.filter((s) => s.status === "active").length} активных`}
          tone="blue"
        />
        <Stat
          icon={<TrendingUp />}
          label="Доход за месяц"
          value={money(income)}
          tone="green"
        />
        <Stat
          icon={<CircleDollarSign />}
          label="Задолженность"
          value={money(debt)}
          tone="orange"
        />
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="section-head">
            <h2>Сегодня</h2>
            <p>{lessons.length} занятия в расписании</p>
          </div>
          {lessons.length ? (
            lessons.map((l) => {
              const group = l.groupId
                  ? data.groups.find((g) => g.id === l.groupId)
                  : undefined,
                student = data.students.find((s) => s.id === l.studentId),
                name = group?.name || student?.name || "Занятие";
              return (
                <div className="lesson-row" key={l.id}>
                  <div className="time">
                    <b>{l.time}</b>
                    <small>{l.duration} мин</small>
                  </div>
                  <div className="avatar">{group ? "Г" : initials(name)}</div>
                  <div className="grow">
                    <b>{name}</b>
                    <small>
                      {group
                        ? `${group.studentIds.length} ученика · ${l.subject}`
                        : `${l.subject}${l.topic ? " · " + l.topic : ""}`}
                    </small>
                  </div>
                  <span className={`badge ${l.status}`}>
                    {l.status === "done" ? "Проведено" : "Запланировано"}
                  </span>
                  <b>
                    {money(l.price)}
                    {group ? " / ученик" : ""}
                  </b>
                  {l.status === "planned" && (
                    <Button kind="ghost" onClick={() => mark(l.id)}>
                      Отметить проведённым
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <Empty
              title="Сегодня занятий нет"
              text="Можно подготовиться к следующему учебному дню."
            />
          )}
        </section>
        <section>
          <div className="section-head">
            <h2>Требует внимания</h2>
            <p>Не упустите важное</p>
          </div>
          <div className="attention">
            {attention.slice(0, 5).map((x, i) => (
              <div key={i}>
                <i className={x.kind} />
                <span className="attention-copy">
                  <b>{x.title}</b>
                  {x.sub && <small>{x.sub}</small>}
                </span>
                <ArrowRight />
              </div>
            ))}
          </div>
          <div className="mini-tip">
            <CheckCircle2 />
            <span>
              <b>Неделя идёт отлично</b>
              <small>
                Проведено {done} из {week.length} занятий
              </small>
            </span>
            <strong>{pct}%</strong>
          </div>
        </section>
      </div>
    </>
  );
}

type FormState = {
  name: string;
  groupId: string;
  grade: string;
  contact: string;
  parent: string;
  parentContact: string;
  price: number;
  goal: string;
  note: string;
  status: StudentStatus;
};
const initial: FormState = {
  name: "",
  groupId: "",
  grade: "",
  contact: "",
  parent: "",
  parentContact: "",
  price: 800,
  goal: "",
  note: "",
  status: "active",
};
export function RestoredStudents() {
  const { data, setData, notify } = useApp(),
    nav = useNavigate(),
    [mode, setMode] = useState<"students" | "groups">("students"),
    [filter, setFilter] = useState("all"),
    [add, setAdd] = useState(false),
    [form, setForm] = useState(initial),
    [groupForm, setGroupForm] = useState({
      name: "",
      level: "",
      price: 700,
      studentIds: [] as string[],
    }),
    [error, setError] = useState(""),
    [created, setCreated] = useState<string>(),
    [schedule, setSchedule] = useState<string>();
  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Укажите имя ученика");
      return;
    }
    const id = crypto.randomUUID(),
      { groupId, ...fields } = form,
      s: Student = {
        ...fields,
        id,
        subject: "Английский язык",
        lessons: 0,
        debt: 0,
        next: "Не запланировано",
        paymentMode: "perLesson",
      };
    setData((d) => ({
      ...d,
      students: [...d.students, s],
      groups: groupId
        ? d.groups.map((g) =>
            g.id === groupId && g.studentIds.length < 6
              ? { ...g, studentIds: [...g.studentIds, id] }
              : g,
          )
        : d.groups,
    }));
    setAdd(false);
    setForm(initial);
    setCreated(groupId ? undefined : id);
    notify("Ученик добавлен");
  };
  const saveGroup = (e: FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    setData((d) => ({
      ...d,
      groups: [
        ...d.groups,
        {
          id: crypto.randomUUID(),
          name: groupForm.name,
          level: groupForm.level,
          subject: "Английский язык",
          studentIds: groupForm.studentIds.slice(0, 6),
          maxStudents: 6,
          pricePerStudent: groupForm.price,
          duration: 60,
          status: "active",
          notes: "",
        },
      ],
    }));
    setAdd(false);
    setGroupForm({ name: "", level: "", price: 700, studentIds: [] });
    notify("Группа создана");
  };
  return (
    <>
      <div className="page-title row">
        <div>
          <span className="eyebrow">База учеников</span>
          <h1>{mode === "students" ? "Ученики" : "Группы"}</h1>
          <p>
            {mode === "students"
              ? `${data.students.length} учеников`
              : `${data.groups.length} учебных групп`}
          </p>
        </div>
        <Button onClick={() => setAdd(true)}>
          <Plus /> {mode === "students" ? "Добавить ученика" : "Создать группу"}
        </Button>
      </div>
      <div className="segment">
        <button
          className={mode === "students" ? "active" : ""}
          onClick={() => setMode("students")}
        >
          Ученики
        </button>
        <button
          className={mode === "groups" ? "active" : ""}
          onClick={() => setMode("groups")}
        >
          Группы
        </button>
      </div>
      {mode === "students" ? (
        <>
          <div className="filters standalone">
            {[
              ["all", "Все"],
              ["active", "Активные"],
              ["paused", "На паузе"],
              ["waiting", "Лист ожидания"],
              ["archived", "Архив"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={filter === v ? "active" : ""}
                onClick={() => setFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="student-grid">
            {data.students
              .filter((s) => filter === "all" || s.status === filter)
              .map((s) => {
                const groups = data.groups.filter((g) =>
                  g.studentIds.includes(s.id),
                );
                return (
                  <article
                    className="student-card"
                    key={s.id}
                    onClick={() => nav("/students/" + s.id)}
                  >
                    <div className="student-top">
                      <div className="avatar large">{initials(s.name)}</div>
                      <span className={`badge ${s.status}`}>
                        {s.status === "active"
                          ? "Активный"
                          : s.status === "paused"
                            ? "На паузе"
                            : s.status === "waiting"
                              ? "Лист ожидания"
                              : "Архив"}
                      </span>
                    </div>
                    <h3>{s.name}</h3>
                    <p>
                      {s.grade} · {s.subject}
                    </p>
                    <div className="learning-format">
                      {groups.length
                        ? `В группе: ${groups.map((g) => g.name).join(", ")}`
                        : "Индивидуально"}
                    </div>
                    <div className="student-info">
                      <span>
                        <small>Стоимость</small>
                        <b>{money(s.price)}</b>
                      </span>
                      <span>
                        <small>Следующее</small>
                        <b>{s.next}</b>
                      </span>
                    </div>
                    <Button kind="ghost">
                      Открыть профиль <ArrowRight />
                    </Button>
                  </article>
                );
              })}
          </div>
        </>
      ) : data.groups.length ? (
        <div className="student-grid">
          {data.groups.map((g) => (
            <article
              className="student-card group-card"
              key={g.id}
              onClick={() => nav("/groups/" + g.id)}
            >
              <div className="student-top">
                <div className="avatar large">
                  <Users />
                </div>
                <span className="badge active">{g.studentIds.length} из 6</span>
              </div>
              <h3>{g.name}</h3>
              <p>
                {g.level} · {g.subject}
              </p>
              <div className="member-names">
                {g.studentIds
                  .map((id) => data.students.find((s) => s.id === id)?.name)
                  .join(", ")}
              </div>
              <Button kind="ghost">
                Открыть группу <ArrowRight />
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Пока нет групп" text="Создайте первую группу." />
      )}
      {add && mode === "students" && (
        <Modal title="Новый ученик" onClose={() => setAdd(false)}>
          <form onSubmit={save}>
            <h3 className="form-section-title">Основная информация</h3>
            <div className="form-grid">
              <label>
                Имя ученика *
                <input
                  className={error ? "invalid" : ""}
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setError("");
                  }}
                />
                {error && <small className="error">{error}</small>}
              </label>
              <label>
                Группа
                <select
                  value={form.groupId}
                  onChange={(e) =>
                    setForm({ ...form, groupId: e.target.value })
                  }
                >
                  <option value="">Индивидуально</option>
                  {data.groups.map((g) => (
                    <option value={g.id} disabled={g.studentIds.length >= 6}>
                      {g.name} — {g.studentIds.length}/6
                      {g.studentIds.length >= 6 ? " · мест нет" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Класс / уровень
                <input
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />
              </label>
              <label>
                Статус
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as StudentStatus,
                    })
                  }
                >
                  <option value="active">Активный</option>
                  <option value="paused">На паузе</option>
                  <option value="waiting">Лист ожидания</option>
                </select>
              </label>
            </div>
            {!data.groups.length && (
              <p className="form-hint">
                Группу можно создать в разделе «Ученики → Группы»
              </p>
            )}
            <h3 className="form-section-title">Контакты</h3>
            <div className="form-grid">
              <label>
                Телефон или контакт ученика
                <input
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                />
              </label>
              <label>
                Имя родителя
                <input
                  value={form.parent}
                  onChange={(e) => setForm({ ...form, parent: e.target.value })}
                />
              </label>
              <label>
                Контакт родителя
                <input
                  value={form.parentContact}
                  onChange={(e) =>
                    setForm({ ...form, parentContact: e.target.value })
                  }
                />
              </label>
            </div>
            <h3 className="form-section-title">Обучение</h3>
            <div className="form-grid">
              <label>
                Стоимость занятия
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: +e.target.value })}
                />
              </label>
              <label>
                Цель обучения
                <input
                  placeholder="Например: Подготовка к ОГЭ"
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                />
              </label>
            </div>
            <label>
              Комментарий репетитора
              <textarea
                rows={3}
                placeholder="Нужно уделить больше внимания грамматике и устной речи"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <Button kind="ghost" onClick={() => setAdd(false)}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </Modal>
      )}
      {add && mode === "groups" && (
        <Modal title="Новая группа" onClose={() => setAdd(false)}>
          <form onSubmit={saveGroup}>
            <div className="form-grid">
              <label>
                Название группы *
                <input
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, name: e.target.value })
                  }
                />
              </label>
              <label>
                Класс / уровень
                <input
                  value={groupForm.level}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, level: e.target.value })
                  }
                />
              </label>
              <label>
                Стоимость с ученика
                <input
                  type="number"
                  value={groupForm.price}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, price: +e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Участники · {groupForm.studentIds.length} из 6
              <div className="student-checks">
                {data.students.map((s) => (
                  <label key={s.id}>
                    <input
                      type="checkbox"
                      checked={groupForm.studentIds.includes(s.id)}
                      disabled={
                        !groupForm.studentIds.includes(s.id) &&
                        groupForm.studentIds.length >= 6
                      }
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          studentIds: e.target.checked
                            ? [...groupForm.studentIds, s.id]
                            : groupForm.studentIds.filter((id) => id !== s.id),
                        })
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </label>
            {groupForm.studentIds.length >= 6 && (
              <p className="error">Достигнут максимум: 6 участников</p>
            )}
            <div className="modal-actions">
              <Button kind="ghost" onClick={() => setAdd(false)}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </Modal>
      )}
      {created && !schedule && (
        <Modal title="Ученик добавлен" onClose={() => setCreated(undefined)}>
          <p>Настроить постоянное расписание занятий?</p>
          <div className="modal-actions">
            <Button kind="ghost" onClick={() => setCreated(undefined)}>
              Позже
            </Button>
            <Button onClick={() => setSchedule(created)}>
              Настроить расписание
            </Button>
          </div>
        </Modal>
      )}
      {schedule && (
        <RecurringForm
          targetType="student"
          targetId={schedule}
          onClose={() => {
            setSchedule(undefined);
            setCreated(undefined);
          }}
        />
      )}
    </>
  );
}

export function RestoredStatistics() {
  const { data } = useApp(),
    year = new Date().getFullYear(),
    payments = monthNames.map((_, m) =>
      data.payments
        .filter((p) => {
          const d = new Date(p.date);
          return d.getFullYear() === year && d.getMonth() === m;
        })
        .reduce((a, p) => a + p.amount, 0),
    ),
    lessonCounts = monthNames.map(
      (_, m) =>
        data.lessons.filter((l) => {
          const d = new Date(l.date);
          return d.getFullYear() === year && d.getMonth() === m;
        }).length,
    ),
    maxIncome = Math.max(...payments, 1),
    maxLessons = Math.max(...lessonCounts, 1),
    done = data.lessons.filter((l) => l.status === "done").length,
    cancelled = data.lessons.filter((l) => l.status === "cancelled").length,
    homeDone = data.homework.filter((h) => h.status === "checked").length,
    homePct = data.homework.length
      ? Math.round((homeDone / data.homework.length) * 100)
      : 0,
    totalIncome = payments.reduce((a, n) => a + n, 0);
  const ranking = data.students
      .map((s) => ({
        s,
        count: data.lessons.filter(
          (l) =>
            l.status === "done" &&
            (l.studentId === s.id ||
              (l.groupId &&
                data.groups
                  .find((g) => g.id === l.groupId)
                  ?.studentIds.includes(s.id))),
        ).length,
      }))
      .sort((a, b) => b.count - a.count),
    maxRank = Math.max(...ranking.map((x) => x.count), 1);
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">Аналитика</span>
        <h1>Статистика</h1>
        <p>Результаты работы за {year} год</p>
      </div>
      <div className="stats">
        <Stat
          icon={<CheckCircle2 />}
          label="Проведено занятий"
          value={String(done)}
          tone="green"
        />
        <Stat
          icon={<XCircle />}
          label="Отменено занятий"
          value={String(cancelled)}
          tone="orange"
        />
        <Stat
          icon={<ClipboardCheck />}
          label="Выполнено домашних заданий"
          value={`${homePct}%`}
          tone="blue"
        />
        <Stat
          icon={<TrendingUp />}
          label="Фактически получено"
          value={money(totalIncome)}
          tone="violet"
        />
      </div>
      <div className="analytics-grid">
        <section className="card income-chart">
          <h2>Доход по месяцам</h2>
          <p>Фактически полученные платежи</p>
          <div className="vertical-chart">
            {payments.map((v, i) => (
              <div>
                <span>
                  <i
                    style={{ height: `${(v / maxIncome) * 100}%` }}
                    title={money(v)}
                  />
                </span>
                <b>{monthNames[i]}</b>
                <small>{v ? money(v) : "—"}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Количество занятий</h2>
          <p>Динамика по месяцам</p>
          <div className="spark-bars">
            {lessonCounts.map((v, i) => (
              <div>
                <i
                  style={{ height: `${Math.max(4, (v / maxLessons) * 100)}%` }}
                />
                <small>{monthNames[i]}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Самые активные ученики</h2>
          <div className="ranking">
            {ranking.slice(0, 6).map((x, i) => (
              <div>
                <span>
                  <b>
                    {i + 1}. {x.s.name}
                  </b>
                  <small>{x.count} занятий</small>
                </span>
                <i>
                  <em style={{ width: `${(x.count / maxRank) * 100}%` }} />
                </i>
              </div>
            ))}
          </div>
        </section>
        <section className="card homework-card">
          <h2>Выполнение домашних заданий</h2>
          <div
            className="donut"
            style={{
              background: `conic-gradient(var(--primary) ${homePct}%,var(--line) 0)`,
            }}
          >
            <span>{homePct}%</span>
          </div>
          <b>
            {homeDone} из {data.homework.length} выполнено
          </b>
          <p>Проверенные домашние задания</p>
        </section>
      </div>
    </>
  );
}
