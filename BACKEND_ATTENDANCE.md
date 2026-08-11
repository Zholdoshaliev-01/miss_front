# Backend: журнал посещаемости и оценок

Нужно обновить существующую модель `Attendance`, чтобы одна ячейка журнала могла хранить:

- `status`: был / опоздал / отсутствовал / уважительная
- `score`: оценка за урок `2-5`, если учитель поставил оценку
- `note`: комментарий

## 1. models.py

В твоём `Attendance` добавь поле `score`:

```python
class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Присутствовал'),
        ('late', 'Опоздал'),
        ('absent', 'Отсутствовал'),
        ('excused', 'Уважительная причина'),
    )

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    note = models.CharField(max_length=500, blank=True)
    marked_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='marked_attendance')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['group', 'student', 'date'],
                name='unique_group_student_attendance_date'
            )
        ]
        ordering = ['-date', 'student_id']
```

Потом:

```bash
python manage.py makemigrations
python manage.py migrate
```

## 2. serializers.py

Замени serializers посещаемости на такие:

```python
class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'date', 'student_id', 'student_name', 'status', 'score', 'note']


class AttendanceItemSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(min_value=1)
    status = serializers.ChoiceField(choices=['present', 'late', 'absent', 'excused'])
    score = serializers.IntegerField(min_value=2, max_value=5, required=False, allow_null=True)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)


class AttendanceBulkSerializer(serializers.Serializer):
    date = serializers.DateField()
    records = AttendanceItemSerializer(many=True, allow_empty=False)

    def validate_records(self, records):
        student_ids = [record['student_id'] for record in records]
        if len(student_ids) != len(set(student_ids)):
            raise serializers.ValidationError('Один ученик указан несколько раз')
        return records
```

## 3. views.py

В `TeacherAttendanceView.get` добавь поддержку месяца:

```python
def get(self, request, group_id):
    group = self.get_group(request, group_id)

    lesson_date = request.query_params.get('date')
    month = request.query_params.get('month')  # формат: 2026-08

    queryset = Attendance.objects.filter(group=group).select_related('student', 'student__user')

    if lesson_date:
        queryset = queryset.filter(date=lesson_date)
    elif month:
        year, month_number = month.split('-')
        queryset = queryset.filter(date__year=year, date__month=month_number)

    serializer = AttendanceRecordSerializer(queryset, many=True)
    return Response({'records': serializer.data})
```

В `TeacherAttendanceView.post` в `defaults` добавь `score`:

```python
defaults={
    'status': record['status'],
    'score': record.get('score'),
    'note': record.get('note', ''),
    'marked_by': request.user,
}
```

## 4. StudentAttendanceView

Чтобы студент тоже видел оценки, serializer уже отдаст `score`. Здесь менять почти ничего не нужно.

Только если хочешь считать процент посещаемости за месяц, можно добавить query `?month=2026-08` так же, как у teacher.

## 5. Что теперь ожидает frontend

Получить месяц:

```text
GET /groups/<group_id>/attendance/?month=2026-08
```

Ответ:

```json
{
  "records": [
    {
      "id": 1,
      "date": "2026-08-11",
      "student_id": 5,
      "student_name": "Argen Nuraliev",
      "status": "present",
      "score": 5,
      "note": ""
    }
  ]
}
```

Сохранить одну ячейку:

```json
{
  "date": "2026-08-11",
  "records": [
    {
      "student_id": 5,
      "status": "present",
      "score": 5,
      "note": ""
    }
  ]
}
```

Если учитель ставит `Н`, frontend отправляет:

```json
{
  "date": "2026-08-11",
  "records": [
    {
      "student_id": 5,
      "status": "absent",
      "score": null,
      "note": ""
    }
  ]
}
```
