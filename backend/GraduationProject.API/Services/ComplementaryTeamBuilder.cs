namespace GraduationProject.API.Services
{
    /// <summary>
    /// Deterministic greedy teams: maximize new skill coverage per seat, avoid redundant overlap when ties occur.
    /// </summary>
    internal static class ComplementaryTeamBuilder
    {
        internal static List<List<StudentForTeam>> BuildComplementaryTeams(
            IReadOnlyList<StudentForTeam> students,
            IReadOnlyDictionary<int, double> scoresByStudentId,
            int requestedTeamSize,
            int projectId)
        {
            var size = Math.Max(1, requestedTeamSize);
            if (students.Count == 0)
                return new List<List<StudentForTeam>>();

            var n = students.Count;
            var teamCount = Math.Max(1, n / size);
            var capacities = ComputeTeamCapacities(n, teamCount);

            var remaining = students.ToList();
            var teams = new List<List<StudentForTeam>>(teamCount);

            for (var t = 0; t < teamCount; t++)
            {
                var cap = capacities[t];
                var team = new List<StudentForTeam>(cap);
                if (remaining.Count == 0)
                    break;

                var seed = PickSeedStudent(remaining, scoresByStudentId, projectId);
                remaining.Remove(seed);
                team.Add(seed);
                var teamSkills = UnionSkills(team);

                while (team.Count < cap && remaining.Count > 0)
                {
                    var next = PickBestComplement(remaining, teamSkills, scoresByStudentId, projectId);
                    remaining.Remove(next);
                    team.Add(next);
                    foreach (var sk in NormalizeSkills(next.Skills))
                        teamSkills.Add(sk);
                }

                teams.Add(team);
            }

            // Any leftover students (should not happen if capacities sum to n)
            while (remaining.Count > 0 && teams.Count > 0)
            {
                var overflow = remaining[0];
                remaining.RemoveAt(0);
                teams[^1].Add(overflow);
            }

            return teams;
        }

        private static int[] ComputeTeamCapacities(int n, int teamCount)
        {
            var baseSize = n / teamCount;
            var remainder = n % teamCount;
            var caps = new int[teamCount];
            for (var i = 0; i < teamCount; i++)
                caps[i] = baseSize + (i < remainder ? 1 : 0);
            return caps;
        }

        private static StudentForTeam PickSeedStudent(
            List<StudentForTeam> remaining,
            IReadOnlyDictionary<int, double> scoresByStudentId,
            int projectId)
        {
            var freq = CountSkillFrequencies(remaining);
            return remaining
                .OrderByDescending(s => RarityScore(s, freq))
                .ThenByDescending(s => NormalizeSkills(s.Skills).Count)
                .ThenByDescending(s => scoresByStudentId.GetValueOrDefault(s.StudentProfileId, 50.0))
                .ThenByDescending(s => ProjectStudentMixKey(projectId, s.StudentProfileId))
                .First();
        }

        private static StudentForTeam PickBestComplement(
            List<StudentForTeam> remaining,
            HashSet<string> teamSkills,
            IReadOnlyDictionary<int, double> scoresByStudentId,
            int projectId)
        {
            return remaining
                .OrderByDescending(s => NewSkillCount(teamSkills, s))
                .ThenBy(s => OverlapCount(teamSkills, s))
                .ThenByDescending(s => scoresByStudentId.GetValueOrDefault(s.StudentProfileId, 50.0))
                .ThenByDescending(s => ProjectStudentMixKey(projectId, s.StudentProfileId))
                .First();
        }

        private static int NewSkillCount(HashSet<string> teamSkills, StudentForTeam s)
        {
            var n = 0;
            foreach (var sk in NormalizeSkills(s.Skills))
            {
                if (!teamSkills.Contains(sk))
                    n++;
            }
            return n;
        }

        private static int OverlapCount(HashSet<string> teamSkills, StudentForTeam s)
        {
            var n = 0;
            foreach (var sk in NormalizeSkills(s.Skills))
            {
                if (teamSkills.Contains(sk))
                    n++;
            }
            return n;
        }

        private static double RarityScore(StudentForTeam s, Dictionary<string, int> freq)
        {
            var skills = NormalizeSkills(s.Skills);
            if (skills.Count == 0)
                return 0;
            var sum = 0.0;
            foreach (var sk in skills)
                sum += 1.0 / Math.Max(1, freq.GetValueOrDefault(sk, 1));
            return sum;
        }

        private static Dictionary<string, int> CountSkillFrequencies(IEnumerable<StudentForTeam> students)
        {
            var freq = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var s in students)
            {
                foreach (var sk in NormalizeSkills(s.Skills))
                    freq[sk] = freq.GetValueOrDefault(sk, 0) + 1;
            }
            return freq;
        }

        private static HashSet<string> UnionSkills(IEnumerable<StudentForTeam> members)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var m in members)
            {
                foreach (var sk in NormalizeSkills(m.Skills))
                    set.Add(sk);
            }
            return set;
        }

        private static HashSet<string> NormalizeSkills(IReadOnlyList<string>? skills)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (skills == null)
                return set;
            foreach (var raw in skills)
            {
                if (string.IsNullOrWhiteSpace(raw))
                    continue;
                var t = raw.Trim();
                if (t.Length > 0)
                    set.Add(t);
            }
            return set;
        }

        /// <summary>Stable per-(project, student) key so ordering differs by project without RNG.</summary>
        private static long ProjectStudentMixKey(int projectId, int studentProfileId)
        {
            var h = (uint)HashCode.Combine(projectId, studentProfileId);
            return ((long)h << 16) ^ (uint)studentProfileId;
        }
    }
}
